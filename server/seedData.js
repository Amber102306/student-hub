// Demo data for `npm run seed:demo`. All names are made up.
import { classesOverlap } from './utils/schedule.js';

// ----- Professors (6) -----
export const PROFESSORS = [
  { name: 'Ramon T. Villanueva', email: 'rtvillanueva@national-u.edu.ph' },
  { name: 'Carmela P. Dizon', email: 'cpdizon@national-u.edu.ph' },
  { name: 'Joselito M. Bautista', email: 'jmbautista@national-u.edu.ph' },
  { name: 'Rowena S. Mercado', email: 'rsmercado@national-u.edu.ph' },
  { name: 'Antonio L. Castillo', email: 'alcastillo@national-u.edu.ph' },
  { name: 'Lorna D. Pascual', email: 'ldpascual@national-u.edu.ph' },
];

// ----- Courses (5) -----
// The Automata code is a placeholder. Change it to the real one.
export const COURSES = [
  { code: 'CCDIGFOL', description: 'INTRODUCTION TO DIGITAL FORENSICS', units: 3 },
  { code: 'CCSFEN2L', description: 'SOFTWARE ENGINEERING 2', units: 3 },
  { code: 'CTAPDEVL', description: 'APPLICATIONS DEVELOPMENT AND EMERGING TECHNOLOGIES', units: 3 },
  { code: 'CTINASSL', description: 'INFORMATION ASSURANCE AND SECURITY', units: 3 },
  { code: 'CCAUTFLL', description: 'AUTOMATA THEORY AND FORMAL LANGUAGES', units: 3 },
];

// ----- Classes: every course has 5 sections (COM241 to COM245) = 25 classes -----
export const SECTIONS = ['COM241', 'COM242', 'COM243', 'COM244', 'COM245'];
const SLOT_STARTS = ['07:00', '09:00', '11:00', '13:00', '15:00'];

const addMin = (t, m) => {
  const total = Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + m;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// [day, minutes, room] for each meeting of a course.
// The first four courses meet 4 times a week, Automata meets 2 times a week.
const PATTERNS = [
  [['Monday', 120, '409MB'], ['Tuesday', 80, '409MB'], ['Thursday', 120, '409MB'], ['Friday', 80, '409MB']],
  [['Monday', 120, '408MB'], ['Tuesday', 80, '501MB'], ['Thursday', 120, '408MB'], ['Friday', 80, '501MB']],
  [['Monday', 120, '501MB'], ['Tuesday', 80, '408MB'], ['Thursday', 120, '501MB'], ['Friday', 80, '408MB']],
  [['Monday', 120, '502MB'], ['Tuesday', 80, '502MB'], ['Thursday', 120, '502MB'], ['Friday', 80, '502MB']],
  [['Wednesday', 120, '410MB'], ['Saturday', 120, '410MB']],
];

// Which professor teaches which class (course c, section s). Professor 5 helps with four classes.
const professorFor = (c, s) => {
  if (c === 4 && s % 2 === 1) return 5;
  if (c === 2 && s === 4) return 5;
  if (c === 0 && s === 3) return 5;
  return c;
};

// Each section gets the 5 courses at different times, so no section overlaps itself.
// Order: course 0 sections 0-4, course 1 sections 0-4, ... (index = course * 5 + section)
export const CLASSES = COURSES.flatMap((_, c) =>
  SECTIONS.map((section, s) => {
    const start = SLOT_STARTS[(c + s) % 5];
    return {
      course: c,
      professor: professorFor(c, s),
      section,
      meetings: PATTERNS[c].map(([day, mins, room]) => ({ day, start, end: addMin(start, mins), room })),
    };
  })
);

// ----- Students: 10 CS, 9 IT, 8 IS -----
const CS = ['Bryce Amber', 'Maria Clara Santos', 'Jose Miguel Reyes', 'Angelica Mae Cruz', 'Mark Anthony Garcia',
  'Kimberly Anne Flores', 'John Paul Ramos', 'Patricia Nicole Mendoza', 'Carlo Emmanuel Aquino', 'Sofia Isabel Navarro'];
const IT = ['Juan Carlos Dela Cruz', 'Christine Joy Lim', 'Rafael Antonio Torres', 'Bianca Louise Salazar', 'Miguel Angelo Domingo',
  'Jasmine Rose Tan', 'Daniel Joseph Bernardo', 'Katrina Faith Ocampo', 'Adrian Luis Pangilinan'];
const IS = ['Nathalie Grace Soriano', 'Francis Xavier Lopez', 'Elaine Marie Castro', 'Gabriel Andrei Cortez',
  'Hannah Beatrice Valdez', 'Joshua Ray Evangelista', 'Trisha Mae Hernandez', 'Vincent Paul Magno'];

const PEOPLE = [
  ...CS.map((name) => ({ name, program: 'BS Computer Science' })),
  ...IT.map((name) => ({ name, program: 'BS Information Technology' })),
  ...IS.map((name) => ({ name, program: 'BS Information Systems' })),
];

const used = new Set();
export const STUDENTS = PEOPLE.map((p, i) => {
  const words = p.name.toLowerCase().split(' ');
  let email = `${words[0][0]}${words[words.length - 1]}@students.national-u.edu.ph`;
  if (i === 0) email = 'udaundobb@students.national-u.edu.ph'; // the demo login
  while (used.has(email)) email = email.replace('@', `${i}@`);
  used.add(email);
  return {
    ...p,
    email,
    phone: `+63917${String(1000000 + i * 37171).slice(0, 7)}`,
    dob: `${2002 + (i % 4)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + ((i * 3) % 28)).padStart(2, '0')}`,
    password: i === 0 ? 'student123' : undefined, // everyone else gets the default password
  };
});

// ----- Registrations: each student takes the 5 courses of one section -----
const statusOf = (i, c) => {
  if (i === 0 && c === 4) return 'pending'; // demo student has one pending course
  if (i % 4 === 1 && c === 4) return 'pending';
  if (i % 7 === 3 && (c === 3 || c === 4)) return 'pending';
  if (i % 9 === 4 && c === 0) return 'rejected';
  return 'enrolled';
};

export const REGISTRATIONS = STUDENTS.flatMap((_, i) =>
  COURSES.map((__, c) => ({ student: i, class: c * 5 + (i % 5), status: statusOf(i, c) }))
);

// ----- Grades: for most enrolled courses -----
const GV = [1.25, 1.5, 1.5, 1.75, 1.75, 2, 2, 2.25, 2.5, 2.75, 3, 1, 1.25, 2, 1.75];
const BRYCE = [[1.5, 1.25], [1.75, 1.5], [1.25, 1.25], [2, 1.75]];

export const GRADES = REGISTRATIONS.filter((r) => r.status === 'enrolled')
  .map((r) => ({ student: r.student, course: Math.floor(r.class / 5) }))
  .filter(({ student: i, course: c }) => i === 0 || (i + c) % 3 !== 0)
  .map(({ student: i, course: c }) => {
    if (i === 0) return { student: i, course: c, midterm: BRYCE[c][0], finals: BRYCE[c][1] };
    return {
      student: i, course: c,
      midterm: GV[(i * 5 + c * 3) % GV.length],
      finals: (i + c) % 17 === 0 ? 5 : GV[(i * 7 + c * 2 + 1) % GV.length], // a few failed examples
    };
  });

// ----- Safety check: no professor, room or section is ever double-booked -----
export function checkNoConflicts() {
  for (let a = 0; a < CLASSES.length; a += 1) {
    for (let b = a + 1; b < CLASSES.length; b += 1) {
      const x = CLASSES[a];
      const y = CLASSES[b];
      if (!classesOverlap(x, y)) continue;
      const rooms = x.meetings.flatMap((m) => y.meetings.filter((n) => n.day === m.day && n.start < m.end && m.start < n.end && n.room === m.room));
      if (x.professor === y.professor || x.section === y.section || rooms.length)
        throw new Error(`Seed conflict between ${COURSES[x.course].code} ${x.section} and ${COURSES[y.course].code} ${y.section}`);
    }
  }
}