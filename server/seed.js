// npm run seed       -> creates the admin account only
// npm run seed:demo  -> also adds sample teachers, subjects, classes, students, registrations and grades
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import Class from './models/Class.js';
import Registration from './models/Registration.js';
import Grade from './models/Grade.js';
import createStudent from './utils/createStudent.js';

await connectDB();

// ----- Admin -----
const email = process.env.ADMIN_EMAIL.toLowerCase();
if (await User.findOne({ email })) {
  console.log('Admin already exists.');
} else {
  await User.create({ email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), role: 'admin' });
  console.log(`Admin created: ${email}`);
}

// ----- Demo data -----
if (process.argv.includes('--demo')) {
  if (await Subject.countDocuments()) {
    console.log('Demo data already exists. Skipped.');
  } else {
    const teachers = await Teacher.insertMany([
      { name: 'Prof. Smith', email: 'smith@national-u.edu.ph', department: 'Computing' },
      { name: 'Prof. Johnson', email: 'johnson@national-u.edu.ph', department: 'Information Security' },
      { name: 'Prof. Williams', email: 'williams@national-u.edu.ph', department: 'Data Systems' },
      { name: 'Prof. Brown', email: 'brown@national-u.edu.ph', department: 'Computing' },
      { name: 'Prof. Davis', email: 'davis@national-u.edu.ph', department: 'Networks' },
    ]);
    const subjects = await Subject.insertMany([
      { code: 'IT201', name: 'Web Application Development', units: 3 },
      { code: 'IT202', name: 'Information Assurance and Security', units: 3 },
      { code: 'IT203', name: 'Database Management Systems', units: 4 },
      { code: 'IT204', name: 'Data Structures and Algorithms', units: 3 },
      { code: 'IT302', name: 'Networking', units: 3 },
    ]);
    const T = Object.fromEntries(teachers.map((t) => [t.name, t._id]));
    const S = Object.fromEntries(subjects.map((s) => [s.code, s._id]));

    const classes = await Class.insertMany([
      { subjectId: S.IT201, teacherId: T['Prof. Smith'], section: 'BSIT-3A', day: 'Mon', start: '09:00', end: '10:30', room: 'Room 301' },
      { subjectId: S.IT203, teacherId: T['Prof. Williams'], section: 'BSIT-3A', day: 'Tue', start: '10:30', end: '12:00', room: 'Lab 2' },
      { subjectId: S.IT202, teacherId: T['Prof. Johnson'], section: 'BSIT-3A', day: 'Wed', start: '13:00', end: '14:30', room: 'Room 305' },
      { subjectId: S.IT204, teacherId: T['Prof. Brown'], section: 'BSIT-3A', day: 'Fri', start: '08:00', end: '09:30', room: 'Room 204' },
      { subjectId: S.IT302, teacherId: T['Prof. Davis'], section: 'BSIT-3A', day: 'Thu', start: '14:30', end: '16:00', room: 'Room 310' },
      { subjectId: S.IT201, teacherId: T['Prof. Smith'], section: 'BSIT-3B', day: 'Mon', start: '10:30', end: '12:00', room: 'Room 302' },
      { subjectId: S.IT204, teacherId: T['Prof. Brown'], section: 'BSIT-3B', day: 'Tue', start: '11:00', end: '12:30', room: 'Room 204' },
    ]);
    const C = Object.fromEntries(classes.map((c, i) => [`c${i + 1}`, c._id]));

    const bryce = await createStudent({ name: 'Bryce Amber', email: 'udaundobb@students.national-u.edu.ph', phone: '+639171234567', dob: '2004-05-05', course: 'BSIT - Web Development', password: 'student123' });
    const maria = await createStudent({ name: 'Maria Santos', email: 'msantos@students.national-u.edu.ph', phone: '+639181112233', dob: '2004-09-11', course: 'BSCS - Intelligent Systems' });
    const juan = await createStudent({ name: 'Juan Dela Cruz', email: 'jdelacruz@students.national-u.edu.ph', phone: '+639191234500', dob: '2003-12-20', course: 'BSIT - Network Security' });

    await Registration.insertMany([
      { studentId: bryce._id, classId: C.c1, status: 'approved' },
      { studentId: bryce._id, classId: C.c2, status: 'approved' },
      { studentId: bryce._id, classId: C.c3, status: 'approved' },
      { studentId: bryce._id, classId: C.c4, status: 'approved' },
      { studentId: bryce._id, classId: C.c5, status: 'pending' },
      { studentId: maria._id, classId: C.c6, status: 'pending' },
      { studentId: juan._id, classId: C.c1, status: 'approved' },
    ]);
    await Grade.insertMany([
      { studentId: bryce._id, subjectId: S.IT201, midterm: 1.5, finals: 1.25 },
      { studentId: bryce._id, subjectId: S.IT202, midterm: 1.75, finals: 1.5 },
      { studentId: bryce._id, subjectId: S.IT203, midterm: 1.25, finals: 1.25 },
      { studentId: bryce._id, subjectId: S.IT204, midterm: 2, finals: 1.75 },
    ]);
    console.log('Demo data added. Student login: udaundobb@students.national-u.edu.ph / student123');
  }
}

await mongoose.disconnect();
