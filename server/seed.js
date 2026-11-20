// npm run seed       -> creates the admin account only
// npm run seed:demo  -> also adds sample professors, courses, classes, students, registrations and grades
// npm run seed:reset -> DELETES everything first, then creates the admin and the demo data again
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
import Student from './models/Student.js';
import createStudent from './utils/createStudent.js';
import { PROFESSORS, COURSES, CLASSES, STUDENTS, REGISTRATIONS, GRADES, checkNoConflicts } from './seedData.js';

await connectDB();

// ----- Reset: delete all data first -----
if (process.argv.includes('--reset')) {
  for (const model of [Registration, Grade, Class, Course, Professor, Student, User]) await model.deleteMany({});
  console.log('Old data deleted.');
}

// ----- Admin -----
const email = process.env.ADMIN_EMAIL.toLowerCase();
if (await User.findOne({ email })) {
  console.log('Admin already exists.');
} else {
  await User.create({ email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), role: 'admin' });
  console.log(`Admin created: ${email}`);
}

// ----- Demo data (all names are made up) -----
if (process.argv.includes('--demo')) {
  if (await Course.countDocuments()) {
    console.log('Demo data already exists. Skipped. (Use npm run seed:reset to start over.)');
  } else {
    checkNoConflicts();

    const professors = await Professor.insertMany(PROFESSORS);
    const courses = await Course.insertMany(COURSES);
    const classes = await Class.insertMany(
      CLASSES.map((c) => ({
        courseId: courses[c.course]._id,
        professorId: professors[c.professor]._id,
        section: c.section,
        meetings: c.meetings,
      }))
    );

    const students = [];
    for (const s of STUDENTS) students.push(await createStudent(s));

    await Registration.insertMany(
      REGISTRATIONS.map((r) => ({ studentId: students[r.student]._id, classId: classes[r.class]._id, status: r.status }))
    );
    await Grade.insertMany(
      GRADES.map((g) => ({ studentId: students[g.student]._id, courseId: courses[g.course]._id, midterm: g.midterm, finals: g.finals }))
    );

    console.log(`Demo data added: ${professors.length} professors, ${courses.length} courses, ${classes.length} classes, ` +
      `${students.length} students, ${REGISTRATIONS.length} registrations, ${GRADES.length} grades.`);
    console.log('Student login: udaundobb@students.national-u.edu.ph / student123');
  }
}

await mongoose.disconnect();