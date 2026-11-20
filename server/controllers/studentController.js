import User from '../models/User.js';
import Student from '../models/Student.js';
import Registration from '../models/Registration.js';
import Grade from '../models/Grade.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import createStudent from '../utils/createStudent.js';

const withEmail = (s) => ({ ...s, email: s.userId?.email, userId: s.userId?._id });

// GET /api/students?q=maria
export const getStudents = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { studentNo: new RegExp(q, 'i') }, { program: new RegExp(q, 'i') }] } : {};
  const list = await Student.find(filter).populate('userId', 'email').sort('studentNo').lean();
  res.json(list.map(withEmail));
});

// POST /api/students  (admin adds one student)
export const createStudentByAdmin = asyncHandler(async (req, res) => {
  res.status(201).json(await createStudent(req.body));
});

// POST /api/students/bulk  body: { students: [...] }
export const bulkCreateStudents = asyncHandler(async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || !students.length) throw new HttpError(400, 'Send a list of students.');
  const created = [];
  const skipped = [];
  for (const [i, row] of students.entries()) {
    try {
      created.push(await createStudent(row));
    } catch (err) {
      skipped.push({ row: i + 1, reason: err.message });
    }
  }
  res.status(201).json({ created: created.length, skipped });
});

// PUT /api/students/:id  (admin edits)
export const updateStudent = asyncHandler(async (req, res) => {
  const { name, phone, dob, program, email } = req.body; // the student number can never be changed
  const student = await Student.findById(req.params.id);
  if (!student) throw new HttpError(404, 'Student not found.');
  if (email) {
    const mail = email.toLowerCase().trim();
    if (await User.exists({ email: mail, _id: { $ne: student.userId } })) throw new HttpError(409, 'That email is already used.');
    await User.updateOne({ _id: student.userId }, { email: mail });
  }
  Object.assign(student, { name, phone: phone || undefined, dob: dob || undefined, program });
  await student.save();
  res.json(student);
});

// PUT /api/students/me  (student edits own profile)
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, dob } = req.body;
  Object.assign(req.student, { name, phone: phone || undefined, dob: dob || undefined });
  await req.student.save();
  res.json(req.student);
});

// DELETE /api/students/:id  (also removes login, registrations, grades)
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new HttpError(404, 'Student not found.');
  await Registration.deleteMany({ studentId: student._id });
  await Grade.deleteMany({ studentId: student._id });
  await User.deleteOne({ _id: student.userId });
  await student.deleteOne();
  res.json({ message: 'Student deleted.' });
});