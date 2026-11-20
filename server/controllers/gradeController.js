import Grade from '../models/Grade.js';
import Class from '../models/Class.js';
import Registration from '../models/Registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/grades   (admin)
export const getGrades = asyncHandler(async (req, res) => {
  res.json(await Grade.find().populate('studentId', 'name studentNo').populate('courseId', 'code description units'));
});

// GET /api/grades/mine   (student)
export const getMyGrades = asyncHandler(async (req, res) => {
  res.json(await Grade.find({ studentId: req.student._id }).populate('courseId', 'code description units'));
});

// PUT /api/grades   body: { studentId, courseId, midterm, finals }   (admin)
// Creates the grade if it is new, updates it if it already exists.
export const saveGrade = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;
  const toScore = (v) => (v === '' || v == null ? null : Number(v));
  const midterm = toScore(req.body.midterm);
  const finals = toScore(req.body.finals);

  // Grades only make sense for courses the student is enrolled in.
  const classIds = (await Class.find({ courseId }).select('_id')).map((c) => c._id);
  const enrolled = await Registration.exists({ studentId, classId: { $in: classIds }, status: 'enrolled' });
  if (!enrolled) throw new HttpError(400, 'This student is not enrolled in that course.');

  const grade = await Grade.findOneAndUpdate(
    { studentId, courseId },
    { midterm, finals },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(grade);
});
