import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/teachers
export const getTeachers = asyncHandler(async (req, res) => {
  res.json(await Teacher.find().sort('name'));
});

// POST /api/teachers
export const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, department } = req.body;
  res.status(201).json(await Teacher.create({ name, email, department }));
});

// POST /api/teachers/bulk  body: { teachers: [...] }
export const bulkCreateTeachers = asyncHandler(async (req, res) => {
  const { teachers } = req.body;
  if (!Array.isArray(teachers) || !teachers.length) throw new HttpError(400, 'Send a list of teachers.');
  const skipped = [];
  let created = 0;
  for (const [i, t] of teachers.entries()) {
    try {
      await Teacher.create({ name: t.name, email: t.email, department: t.department });
      created += 1;
    } catch (err) {
      skipped.push({ row: i + 1, reason: err.message });
    }
  }
  res.status(201).json({ created, skipped });
});

// PUT /api/teachers/:id
export const updateTeacher = asyncHandler(async (req, res) => {
  const { name, email, department } = req.body;
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new HttpError(404, 'Teacher not found.');
  Object.assign(teacher, { name, email, department });
  await teacher.save();
  res.json(teacher);
});

// DELETE /api/teachers/:id  (blocked while the teacher still has classes)
export const deleteTeacher = asyncHandler(async (req, res) => {
  const n = await Class.countDocuments({ teacherId: req.params.id });
  if (n) throw new HttpError(400, `This teacher still teaches ${n} class(es). Reassign or delete those classes first.`);
  const deleted = await Teacher.findByIdAndDelete(req.params.id);
  if (!deleted) throw new HttpError(404, 'Teacher not found.');
  res.json({ message: 'Teacher deleted.' });
});
