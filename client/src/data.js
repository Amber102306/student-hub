// ---------- Constants ----------
// Demo hints for the login screen only.
export const ADMIN = { email: 'admin@national-u.edu.ph', password: 'admin123', name: 'Administrator' };
export const DEMO_STUDENT = { email: 'udaundobb@students.national-u.edu.ph', password: 'student123' };
export const DEFAULT_PASSWORD = 'Welcome123';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NUM = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
export const dayShort = (d) => d.slice(0, 3);

// Placeholder list. Change it to your school's real programs.
export const PROGRAMS = ['BS Computer Science', 'BS Information Technology', 'BS Information Systems'];
export const MAX_UNITS = 24;
// Section codes are 3 letters + 3 numbers, like COM241 or COM242.
export const SECTION_RE = /^[A-Z]{3}\d{3}$/;

// ---------- Helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 9);

export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// 13:00 -> 01:00PM (same style as the school schedule)
export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}${h >= 12 ? 'PM' : 'AM'}`;
};

// A meeting is one time slot: { day, start, end, room }
export const timeRange = (m) => `${fmtTime(m.start)} - ${fmtTime(m.end)}`;
export const fmtUnits = (u) => Number(u).toFixed(1);

export const sortMeetings = (meetings = []) =>
  [...meetings].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || toMin(a.start) - toMin(b.start));

export const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

export const meetingsOverlap = (a, b) =>
  a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

// Returns the day where two classes overlap, or null.
export const overlapDay = (a, b) => {
  for (const x of a.meetings) for (const y of b.meetings) if (meetingsOverlap(x, y)) return x.day;
  return null;
};
export const classesOverlap = (a, b) => overlapDay(a, b) !== null;

export const daysFromToday = (day) => (DAY_NUM[day] - new Date().getDay() + 7) % 7;

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

// Adds the course and professor objects to a class.
export const enrich = (db, c) =>
  c && {
    ...c,
    course: db.courses.find((x) => x.id === c.courseId),
    professor: db.professors.find((x) => x.id === c.professorId),
  };

// Grades use the Philippine scale: 1.00 (best) to 5.00. Passing is 3.00 or better.
export const gradeOf = (grades, studentId, courseId) =>
  grades.find((g) => g.studentId === studentId && g.courseId === courseId);

export const finalRating = (g) =>
  g && g.midterm !== '' && g.finals !== '' ? (Number(g.midterm) + Number(g.finals)) / 2 : null;

export const remarkOf = (rating) => (rating == null ? null : rating <= 3 ? 'passed' : 'failed');