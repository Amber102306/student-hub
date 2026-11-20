import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import HttpError from './httpError.js';
import { DEFAULT_PASSWORD } from './constants.js';

export const nextStudentNo = async () => {
  const last = await Student.findOne().sort({ studentNo: -1 }).select('studentNo');
  const n = last ? Number(last.studentNo.split('-')[1]) + 1 : 1;
  return `2026-${String(n).padStart(5, '0')}`;
};

// Makes the login (User) and the profile (Student) together.
export default async function createStudent({ name, email, phone, dob, program, password }) {
  const mail = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(mail)) throw new HttpError(400, 'Enter a valid email address.');
  if (!name?.trim()) throw new HttpError(400, 'Name is required.');
  if (password && password.length < 8) throw new HttpError(400, 'Password must have at least 8 characters.');
  if (await User.exists({ email: mail })) throw new HttpError(409, 'That email already has an account.');

  const user = await User.create({
    email: mail,
    passwordHash: await bcrypt.hash(password || DEFAULT_PASSWORD, 10),
    role: 'student',
  });
  try {
    return await Student.create({
      userId: user._id,
      studentNo: await nextStudentNo(),
      name: name.trim(),
      phone: phone || undefined,
      dob: dob || undefined,
      program,
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // undo the login if the profile fails
    throw err;
  }
}