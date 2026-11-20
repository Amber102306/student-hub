import Class from '../models/Class.js';
import Course from '../models/Course.js';
import Professor from '../models/Professor.js';
import Registration from '../models/Registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { meetingsOverlap } from '../utils/schedule.js';

const populate = (q) => q.populate('courseId', 'code description units').populate('professorId', 'name');

const pick = (b) => ({
  courseId: b.courseId,
  professorId: b.professorId,
  section: b.section?.trim().toUpperCase(),
  meetings: (b.meetings || []).map((m) => ({ day: m.day, start: m.start, end: m.end, room: m.room?.trim() })),
});

// Looks for a professor, room or section that is already busy at the same time.
const findConflict = async (data, ignoreId) => {
  const others = await Class.find(ignoreId ? { _id: { $ne: ignoreId } } : {}).populate('courseId', 'code');
  for (const c of others) {
    for (const a of c.meetings) {
      for (const b of data.meetings) {
        if (!meetingsOverlap(a, b)) continue;
        const where = `${c.courseId?.code} (${c.section}) on ${a.day} ${a.start}-${a.end}`;
        if (String(c.professorId) === String(data.professorId)) return `Professor conflict: already teaches ${where}.`;
        if (a.room.toLowerCase() === b.room.toLowerCase()) return `Room conflict: ${a.room} is used by ${where}.`;
        if (c.section === data.section) return `Section conflict: ${data.section} already has ${where}.`;
      }
    }
  }
  return null;
};

const check = async (data, ignoreId) => {
  if (!(await Course.exists({ _id: data.courseId }))) throw new HttpError(400, 'Course not found.');
  if (!(await Professor.exists({ _id: data.professorId }))) throw new HttpError(400, 'Professor not found.');
  await new Class(data).validate(); // format, end after start, own slots do not overlap
  const conflict = await findConflict(data, ignoreId);
  if (conflict) throw new HttpError(409, conflict);
};

// GET /api/classes
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await populate(Class.find().sort('section')).lean();
  const counts = await Registration.aggregate([
    { $match: { status: 'enrolled' } },
    { $group: { _id: '$classId', n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(classes.map((c) => ({ ...c, enrolled: map[String(c._id)] || 0 })));
});

// POST /api/classes
export const createClass = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  await check(data);
  res.status(201).json(await Class.create(data));
});

// PUT /api/classes/:id
export const updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new HttpError(404, 'Class not found.');
  const data = pick(req.body);
  await check(data, cls._id);
  Object.assign(cls, data);
  await cls.save();
  res.json(cls);
});

// DELETE /api/classes/:id  (also removes its registrations)
export const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) throw new HttpError(404, 'Class not found.');
  await Registration.deleteMany({ classId: cls._id });
  await cls.deleteOne();
  res.json({ message: 'Class deleted.' });
});
