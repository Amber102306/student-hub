import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import User from '../models/User.js';
import Student from '../models/Student.js';
import HttpError from './httpError.js';
import { DEFAULT_PASSWORD } from './constants.js';

// Random student number like 2026-1003637: current year, a dash, 7 random digits. Always unique.
export const generateStudentNo = async () => {
  for (let i = 0; i < 20; i += 1) {
    const no = `${new Date().getFullYear()}-${randomInt(1000000, 10000000)}`;
    if (!(await Student.exists({ studentNo: no }))) return no;
  }
  throw new HttpError(500, 'Could not make a student number. Please try again.');
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
      studentNo: await generateStudentNo(),
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