// npm run seed       -> creates the admin account only
// npm run seed:demo  -> also adds sample professors, courses, classes, students, registrations and grades
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Professor from './models/Professor.js';
import Course from './models/Course.js';
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

// ----- Demo data (based on a real school schedule) -----
if (process.argv.includes('--demo')) {
  if (await Course.countDocuments()) {
    console.log('Demo data already exists. Skipped.');
  } else {
    const professors = await Professor.insertMany([
      { name: 'Mr. Gaudencio Jeffrey G. Romano', email: 'gjgromano@national-u.edu.ph', department: 'Computing' },
      { name: 'Ms. Elsie V. Isip', email: 'evisip@national-u.edu.ph', department: 'Computing' },
      { name: 'Mr. Dhani I. San Jose', email: 'disanjose@national-u.edu.ph', department: 'Computing' },
      { name: 'Florencio V. Contreras Jr.', email: 'fvcontreras@national-u.edu.ph', department: 'Computing' },
    ]);
    const courses = await Course.insertMany([
      { code: 'CCDIGFOL', description: 'INTRODUCTION TO DIGITAL FORENSICS', units: 3 },
      { code: 'CCSFEN2L', description: 'SOFTWARE ENGINEERING 2', units: 3 },
      { code: 'CTAPDEVL', description: 'APPLICATIONS DEVELOPMENT AND EMERGING TECHNOLOGIES', units: 3 },
      { code: 'CTINASSL', description: 'INFORMATION ASSURANCE AND SECURITY', units: 3 },
    ]);
    const P = { romano: professors[0]._id, isip: professors[1]._id, sanjose: professors[2]._id, contreras: professors[3]._id };
    const C = Object.fromEntries(courses.map((c) => [c.code, c._id]));
    const m = (day, start, end, room) => ({ day, start, end, room });

    const classes = await Class.insertMany([
      { courseId: C.CCDIGFOL, professorId: P.romano, section: 'COM241', meetings: [
        m('Monday', '13:00', '15:00', '409MB'), m('Tuesday', '13:40', '15:00', '409MB'),
        m('Thursday', '13:00', '15:00', '409MB'), m('Friday', '13:40', '15:00', '409MB')] },
      { courseId: C.CCSFEN2L, professorId: P.isip, section: 'COM241', meetings: [
        m('Monday', '11:00', '13:00', '408MB'), m('Tuesday', '11:00', '12:20', '501MB'),
        m('Thursday', '11:00', '13:00', '408MB'), m('Friday', '11:00', '12:20', '501MB')] },
      { courseId: C.CTAPDEVL, professorId: P.sanjose, section: 'COM241', meetings: [
        m('Monday', '07:00', '08:20', '501MB'), m('Tuesday', '07:00', '09:00', '408MB'),
        m('Thursday', '07:00', '08:20', '501MB'), m('Friday', '07:00', '09:00', '408MB')] },
      { courseId: C.CTINASSL, professorId: P.contreras, section: 'COM241', meetings: [
        m('Monday', '08:20', '09:40', '501MB'), m('Tuesday', '09:00', '11:00', '408MB'),
        m('Thursday', '08:20', '09:40', '501MB'), m('Friday', '09:00', '11:00', '408MB')] },
      // Other sections, so students have classes to register for
      { courseId: C.CCSFEN2L, professorId: P.isip, section: 'COM242', meetings: [
        m('Wednesday', '09:00', '12:00', '502MB')] },
      { courseId: C.CTAPDEVL, professorId: P.sanjose, section: 'COM242', meetings: [
        m('Tuesday', '10:00', '12:00', '410MB'), m('Friday', '10:00', '12:00', '410MB')] },
      { courseId: C.CCDIGFOL, professorId: P.romano, section: 'COM242', meetings: [
        m('Wednesday', '13:00', '16:00', '409MB')] },
    ]);
    const K = Object.fromEntries(classes.map((c, i) => [`c${i + 1}`, c._id]));

    const bryce = await createStudent({ name: 'Bryce Amber', email: 'udaundobb@students.national-u.edu.ph', phone: '+639171234567', dob: '2004-05-05', program: 'BS Computer Science', password: 'student123' });
    const maria = await createStudent({ name: 'Maria Santos', email: 'msantos@students.national-u.edu.ph', phone: '+639181112233', dob: '2004-09-11', program: 'BS Computer Science' });
    const juan = await createStudent({ name: 'Juan Dela Cruz', email: 'jdelacruz@students.national-u.edu.ph', phone: '+639191234500', dob: '2003-12-20', program: 'BS Information Technology' });

    await Registration.insertMany([
      { studentId: bryce._id, classId: K.c1, status: 'enrolled' },
      { studentId: bryce._id, classId: K.c2, status: 'enrolled' },
      { studentId: bryce._id, classId: K.c3, status: 'enrolled' },
      { studentId: bryce._id, classId: K.c4, status: 'enrolled' },
      { studentId: maria._id, classId: K.c5, status: 'pending' },
      { studentId: juan._id, classId: K.c3, status: 'enrolled' },
      { studentId: juan._id, classId: K.c7, status: 'pending' },
    ]);
    await Grade.insertMany([
      { studentId: bryce._id, courseId: C.CCDIGFOL, midterm: 1.5, finals: 1.25 },
      { studentId: bryce._id, courseId: C.CCSFEN2L, midterm: 1.75, finals: 1.5 },
      { studentId: bryce._id, courseId: C.CTAPDEVL, midterm: 1.25, finals: 1.25 },
      { studentId: bryce._id, courseId: C.CTINASSL, midterm: 2, finals: 1.75 },
    ]);
    console.log('Demo data added. Student login: udaundobb@students.national-u.edu.ph / student123');
  }
}

await mongoose.disconnect();
