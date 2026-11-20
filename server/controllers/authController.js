import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import createStudent from '../utils/createStudent.js';

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const payload = async (user) => ({
  user: { id: user._id, email: user.email, role: user.role },
  student: user.role === 'student' ? await Student.findOne({ userId: user._id }) : null,
});

// POST /api/auth/register  (student sign up)
export const register = asyncHandler(async (req, res) => {
  const { name, email, course, password } = req.body;
  if (!password) throw new HttpError(400, 'Password is required.');
  const student = await createStudent({ name, email, course, password });
  const user = await User.findById(student.userId);
  res.status(201).json({ token: sign(user), ...(await payload(user)) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash)))
    throw new HttpError(401, 'Wrong email or password. Please try again.');
  res.json({ token: sign(user), ...(await payload(user)) });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => res.json(await payload(req.user)));

// PUT /api/auth/password
export const changePassword = asyncHandler(async (req, res) => {
  const { current, next } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(current || '', user.passwordHash))) throw new HttpError(400, 'Current password is wrong.');
  if (!next || next.length < 8) throw new HttpError(400, 'New password must have at least 8 characters.');
  if (next === current) throw new HttpError(400, 'New password must be different from the current one.');
  user.passwordHash = await bcrypt.hash(next, 10);
  await user.save();
  res.json({ message: 'Password changed.' });
});
