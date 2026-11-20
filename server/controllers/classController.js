import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Registration from '../models/Registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { overlaps } from '../utils/schedule.js';

const populate = (q) => q.populate('subjectId', 'code name units').populate('teacherId', 'name');

// Looks for a teacher, room or section that is already busy at this time.
const findConflict = async (data, ignoreId) => {
  const query = { day: data.day };
  if (ignoreId) query._id = { $ne: ignoreId };
  const same = await Class.find(query).populate('subjectId', 'code');
  for (const c of same) {
    if (!overlaps(c, data)) continue;
    const where = `${c.subjectId?.code} (${c.section}) on ${c.day} ${c.start}-${c.end}`;
    if (String(c.teacherId) === String(data.teacherId)) return `Teacher conflict: already teaches ${where}.`;
    if (c.room.toLowerCase() === data.room.toLowerCase()) return `Room conflict: ${c.room} is used by ${where}.`;
    if (c.section.toLowerCase() === data.section.toLowerCase()) return `Section conflict: ${data.section} already has ${where}.`;
  }
  return null;
};

const pick = (b) => ({
  subjectId: b.subjectId, teacherId: b.teacherId, section: b.section?.trim(),
  day: b.day, start: b.start, end: b.end, room: b.room?.trim(),
});

const check = async (data, ignoreId) => {
  if (!(await Subject.exists({ _id: data.subjectId }))) throw new HttpError(400, 'Subject not found.');
  if (!(await Teacher.exists({ _id: data.teacherId }))) throw new HttpError(400, 'Teacher not found.');
  const probe = new Class(data);
  await probe.validate(); // format and end > start
  const conflict = await findConflict(data, ignoreId);
  if (conflict) throw new HttpError(409, conflict);
};

// GET /api/classes
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await populate(Class.find().sort('day start')).lean();
  const counts = await Registration.aggregate([
    { $match: { status: 'approved' } },
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
