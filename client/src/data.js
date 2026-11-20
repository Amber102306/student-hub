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
