// ---------- Constants ----------
// Mock accounts only. The real backend should hash passwords.
export const ADMIN = { email: 'admin@national-u.edu.ph', password: 'admin123', name: 'Administrator' };
export const DEMO_STUDENT = { email: 'udaundobb@students.national-u.edu.ph', password: 'student123' };
export const DEFAULT_PASSWORD = 'Welcome123';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NUM = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export const COURSES = [
  'BSIT - Web Development',
  'BSIT - Network Security',
  'BSCS - Intelligent Systems',
  'BSIS - Business Analytics',
];
export const MAX_UNITS = 24;

// ---------- Helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 9);

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const timeRange = (c) => `${fmtTime(c.start)} - ${fmtTime(c.end)}`;

export const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

// Two classes overlap when they are on the same day and the times cross.
export const overlaps = (a, b) =>
  a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

export const daysFromToday = (day) => (DAY_NUM[day] - new Date().getDay() + 7) % 7;

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export const nextStudentNo = (students) => {
  const max = students.reduce((m, s) => Math.max(m, Number(s.studentNo.split('-')[1]) || 0), 0);
  return `2026-${String(max + 1).padStart(5, '0')}`;
};

export const enrich = (db, c) =>
  c && {
    ...c,
    subject: db.subjects.find((s) => s.id === c.subjectId),
    teacher: db.teachers.find((t) => t.id === c.teacherId),
  };

// Grades use the Philippine scale: 1.00 (best) to 5.00. Passing is 3.00 or better.
export const gradeOf = (grades, studentId, subjectId) =>
  grades.find((g) => g.studentId === studentId && g.subjectId === subjectId);

export const finalRating = (g) =>
  g && g.midterm !== '' && g.finals !== '' ? (Number(g.midterm) + Number(g.finals)) / 2 : null;

export const remarkOf = (rating) => (rating == null ? null : rating <= 3 ? 'passed' : 'failed');

// ---------- Seed data ----------
export const SEED_TEACHERS = [
  { id: 't1', name: 'Prof. Smith', email: 'smith@national-u.edu.ph', department: 'Computing' },
  { id: 't2', name: 'Prof. Johnson', email: 'johnson@national-u.edu.ph', department: 'Information Security' },
  { id: 't3', name: 'Prof. Williams', email: 'williams@national-u.edu.ph', department: 'Data Systems' },
  { id: 't4', name: 'Prof. Brown', email: 'brown@national-u.edu.ph', department: 'Computing' },
  { id: 't5', name: 'Prof. Davis', email: 'davis@national-u.edu.ph', department: 'Networks' },
];

export const SEED_SUBJECTS = [
  { id: 's1', code: 'IT201', name: 'Web Application Development', units: 3 },
  { id: 's2', code: 'IT202', name: 'Information Assurance and Security', units: 3 },
  { id: 's3', code: 'IT203', name: 'Database Management Systems', units: 4 },
  { id: 's4', code: 'IT204', name: 'Data Structures and Algorithms', units: 3 },
  { id: 's5', code: 'IT302', name: 'Networking', units: 3 },
];

export const SEED_CLASSES = [
  { id: 'c1', subjectId: 's1', teacherId: 't1', section: 'BSIT-3A', day: 'Mon', start: '09:00', end: '10:30', room: 'Room 301' },
  { id: 'c2', subjectId: 's3', teacherId: 't3', section: 'BSIT-3A', day: 'Tue', start: '10:30', end: '12:00', room: 'Lab 2' },
  { id: 'c3', subjectId: 's2', teacherId: 't2', section: 'BSIT-3A', day: 'Wed', start: '13:00', end: '14:30', room: 'Room 305' },
  { id: 'c4', subjectId: 's4', teacherId: 't4', section: 'BSIT-3A', day: 'Fri', start: '08:00', end: '09:30', room: 'Room 204' },
  { id: 'c5', subjectId: 's5', teacherId: 't5', section: 'BSIT-3A', day: 'Thu', start: '14:30', end: '16:00', room: 'Room 310' },
  { id: 'c6', subjectId: 's1', teacherId: 't1', section: 'BSIT-3B', day: 'Mon', start: '10:30', end: '12:00', room: 'Room 302' },
  { id: 'c7', subjectId: 's4', teacherId: 't4', section: 'BSIT-3B', day: 'Tue', start: '11:00', end: '12:30', room: 'Room 204' },
];

export const SEED_STUDENTS = [
  { id: 'u1', studentNo: '2026-00123', name: 'Bryce Amber', email: DEMO_STUDENT.email, password: DEMO_STUDENT.password, phone: '+639171234567', dob: '2004-05-05', course: 'BSIT - Web Development' },
  { id: 'u2', studentNo: '2026-00124', name: 'Maria Santos', email: 'msantos@students.national-u.edu.ph', password: DEFAULT_PASSWORD, phone: '+639181112233', dob: '2004-09-11', course: 'BSCS - Intelligent Systems' },
  { id: 'u3', studentNo: '2026-00125', name: 'Juan Dela Cruz', email: 'jdelacruz@students.national-u.edu.ph', password: DEFAULT_PASSWORD, phone: '+639191234500', dob: '2003-12-20', course: 'BSIT - Network Security' },
];

export const SEED_REGISTRATIONS = [
  { id: 'r1', studentId: 'u1', classId: 'c1', status: 'approved' },
  { id: 'r2', studentId: 'u1', classId: 'c2', status: 'approved' },
  { id: 'r3', studentId: 'u1', classId: 'c3', status: 'approved' },
  { id: 'r4', studentId: 'u1', classId: 'c4', status: 'approved' },
  { id: 'r5', studentId: 'u1', classId: 'c5', status: 'pending' },
  { id: 'r6', studentId: 'u2', classId: 'c6', status: 'pending' },
  { id: 'r7', studentId: 'u3', classId: 'c1', status: 'approved' },
];

export const SEED_GRADES = [
  { id: 'g1', studentId: 'u1', subjectId: 's1', midterm: 1.5, finals: 1.25 },
  { id: 'g2', studentId: 'u1', subjectId: 's2', midterm: 1.75, finals: 1.5 },
  { id: 'g3', studentId: 'u1', subjectId: 's3', midterm: 1.25, finals: 1.25 },
  { id: 'g4', studentId: 'u1', subjectId: 's4', midterm: 2, finals: 1.75 },
];