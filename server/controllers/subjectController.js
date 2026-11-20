import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import Registration from '../models/Registration.js';
import Grade from '../models/Grade.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/subjects
export const getSubjects = asyncHandler(async (req, res) => {
  res.json(await Subject.find().sort('code'));
});

// POST /api/subjects
export const createSubject = asyncHandler(async (req, res) => {
  const { code, name, units } = req.body;
  res.status(201).json(await Subject.create({ code, name, units }));
});

// POST /api/subjects/bulk  body: { subjects: [...] }
export const bulkCreateSubjects = asyncHandler(async (req, res) => {
  const { subjects } = req.body;
  if (!Array.isArray(subjects) || !subjects.length) throw new HttpError(400, 'Send a list of subjects.');
  const skipped = [];
  let created = 0;
  for (const [i, s] of subjects.entries()) {
    try {
      await Subject.create({ code: s.code, name: s.name, units: Number(s.units) });
      created += 1;
    } catch (err) {
      skipped.push({ row: i + 1, reason: err.message });
    }
  }
  res.status(201).json({ created, skipped });
});

// PUT /api/subjects/:id
export const updateSubject = asyncHandler(async (req, res) => {
  const { code, name, units } = req.body;
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new HttpError(404, 'Subject not found.');
  Object.assign(subject, { code, name, units });
  await subject.save();
  res.json(subject);
});

// DELETE /api/subjects/:id  (also removes its classes, registrations, grades)
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) throw new HttpError(404, 'Subject not found.');
  const classIds = (await Class.find({ subjectId: subject._id }).select('_id')).map((c) => c._id);
  await Registration.deleteMany({ classId: { $in: classIds } });
  await Class.deleteMany({ subjectId: subject._id });
  await Grade.deleteMany({ subjectId: subject._id });
  await subject.deleteOne();
  res.json({ message: 'Subject deleted.' });
});
