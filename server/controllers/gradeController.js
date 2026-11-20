import Grade from '../models/Grade.js';
import Class from '../models/Class.js';
import Registration from '../models/Registration.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/grades   (admin)
export const getGrades = asyncHandler(async (req, res) => {
  res.json(await Grade.find().populate('studentId', 'name studentNo').populate('subjectId', 'code name units'));
});

// GET /api/grades/mine   (student)
export const getMyGrades = asyncHandler(async (req, res) => {
  res.json(await Grade.find({ studentId: req.student._id }).populate('subjectId', 'code name units'));
});

// PUT /api/grades   body: { studentId, subjectId, midterm, finals }   (admin)
// Creates the grade if it is new, updates it if it already exists.
export const saveGrade = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.body;
  const toScore = (v) => (v === '' || v == null ? null : Number(v));
  const midterm = toScore(req.body.midterm);
  const finals = toScore(req.body.finals);

  // Grades only make sense for subjects the student is approved in.
  const classIds = (await Class.find({ subjectId }).select('_id')).map((c) => c._id);
  const approved = await Registration.exists({ studentId, classId: { $in: classIds }, status: 'approved' });
  if (!approved) throw new HttpError(400, 'This student has no approved registration for that subject.');

  const grade = await Grade.findOneAndUpdate(
    { studentId, subjectId },
    { midterm, finals },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(grade);
});
