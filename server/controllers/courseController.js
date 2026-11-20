import Course from '../models/Course.js';
import Class from '../models/Class.js';
import Registration from '../models/Registration.js';
import Grade from '../models/Grade.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/courses
export const getCourses = asyncHandler(async (req, res) => {
  res.json(await Course.find().sort('code'));
});

// POST /api/courses
export const createCourse = asyncHandler(async (req, res) => {
  const { code, description, units } = req.body;
  res.status(201).json(await Course.create({ code, description, units }));
});

// POST /api/courses/bulk  body: { courses: [...] }
export const bulkCreateCourses = asyncHandler(async (req, res) => {
  const { courses } = req.body;
  if (!Array.isArray(courses) || !courses.length) throw new HttpError(400, 'Send a list of courses.');
  const skipped = [];
  let created = 0;
  for (const [i, c] of courses.entries()) {
    try {
      await Course.create({ code: c.code, description: c.description, units: Number(c.units) });
      created += 1;
    } catch (err) {
      skipped.push({ row: i + 1, reason: err.message });
    }
  }
  res.status(201).json({ created, skipped });
});

// PUT /api/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const { code, description, units } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) throw new HttpError(404, 'Course not found.');
  Object.assign(course, { code, description, units });
  await course.save();
  res.json(course);
});

// DELETE /api/courses/:id  (also removes its classes, registrations, grades)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new HttpError(404, 'Course not found.');
  const classIds = (await Class.find({ courseId: course._id }).select('_id')).map((c) => c._id);
  await Registration.deleteMany({ classId: { $in: classIds } });
  await Class.deleteMany({ courseId: course._id });
  await Grade.deleteMany({ courseId: course._id });
  await course.deleteOne();
  res.json({ message: 'Course deleted.' });
});
