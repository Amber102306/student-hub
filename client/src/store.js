import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const EMPTY = { students: [], professors: [], courses: [], classes: [], registrations: [], grades: [] };
const idOf = (x) => (x && typeof x === 'object' ? x._id : x);

// The server uses _id and populated objects. These turn them into the
// simple shapes the pages already use (id, courseId, '' for empty grades).
const toStudent = (s, email) => ({
  id: s._id, studentNo: s.studentNo, name: s.name, email: s.email ?? email ?? '',
  phone: s.phone || '', dob: s.dob ? s.dob.slice(0, 10) : '', program: s.program,
});
const toProfessor = (p) => ({ id: p._id, name: p.name, email: p.email, department: p.department });
const toCourse = (c) => ({ id: c._id, code: c.code, description: c.description, units: c.units });
const toClass = (c) => ({
  id: c._id, courseId: idOf(c.courseId), professorId: idOf(c.professorId), section: c.section,
  meetings: c.meetings.map((m) => ({ day: m.day, start: m.start, end: m.end, room: m.room })),
});
const toReg = (r) => ({ id: r._id, studentId: idOf(r.studentId), classId: idOf(r.classId), status: r.status });
const toGrade = (g) => ({
  id: g._id, studentId: idOf(g.studentId), courseId: idOf(g.courseId), midterm: g.midterm ?? '', finals: g.finals ?? '',
});

export const buildSession = ({ user, student }) =>
  user.role === 'admin'
    ? { role: 'admin', user }
    : { role: 'student', user, student: toStudent(student, user.email), id: student._id };

// Same actions as before, but now they call the API and then reload the data.
export function useDB(session) {
  const [data, setData] = useState(EMPTY);
  const [loadedFor, setLoadedFor] = useState(null);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    if (!session) return;
    if (session.role === 'admin') {
      const [students, professors, courses, classes, registrations, grades] = await Promise.all([
        api.get('/students'), api.get('/professors'), api.get('/courses'),
        api.get('/classes'), api.get('/registrations'), api.get('/grades'),
      ]);
      setData({
        students: students.map((s) => toStudent(s)),
        professors: professors.map(toProfessor),
        courses: courses.map(toCourse),
        classes: classes.map(toClass),
        registrations: registrations.map(toReg),
        grades: grades.map(toGrade),
      });
    } else {
      const [me, professors, courses, classes, registrations, grades] = await Promise.all([
        api.get('/auth/me'), api.get('/professors'), api.get('/courses'),
        api.get('/classes'), api.get('/registrations/mine'), api.get('/grades/mine'),
      ]);
      setData({
        students: [toStudent(me.student, me.user.email)],
        professors: professors.map(toProfessor),
        courses: courses.map(toCourse),
        classes: classes.map(toClass),
        registrations: registrations.map(toReg),
        grades: grades.map(toGrade),
      });
    }
    setLoadedFor(session.user.id);
  }, [session]);

  useEffect(() => {
    if (!session) { setData(EMPTY); setLoadedFor(null); setLoadError(''); return; }
    setLoadError('');
    reload().catch((e) => setLoadError(e.message));
  }, [session, reload]);

  // Run an API call, then refresh the lists. Errors go back to the page.
  const run = (fn) => async (...args) => {
    const result = await fn(...args);
    await reload();
    return result;
  };

  return {
    ...data,
    loading: !!session && loadedFor !== session.user.id && !loadError,
    loadError,
    reload,

    // Professors
    addProfessor: run((v) => api.post('/professors', v)),
    editProfessor: run((id, v) => api.put(`/professors/${id}`, v)),
    removeProfessor: run((id) => api.del(`/professors/${id}`)),
    addProfessors: run((list) => api.post('/professors/bulk', { professors: list })),

    // Courses
    addCourse: run((v) => api.post('/courses', v)),
    editCourse: run((id, v) => api.put(`/courses/${id}`, v)),
    removeCourse: run((id) => api.del(`/courses/${id}`)),
    addCourses: run((list) => api.post('/courses/bulk', { courses: list })),

    // Classes
    addClass: run((v) => api.post('/classes', v)),
    editClass: run((id, v) => api.put(`/classes/${id}`, v)),
    removeClass: run((id) => api.del(`/classes/${id}`)),

    // Students (admin)
    addStudent: run((v) => api.post('/students', v)),
    addStudents: run((list) => api.post('/students/bulk', { students: list })),
    editStudent: run((id, v) => api.put(`/students/${id}`, v)),
    removeStudent: run((id) => api.del(`/students/${id}`)),

    // Student (own account)
    updateMyProfile: run((v) => api.put('/students/me', v)),
    changePassword: (current, next) => api.put('/auth/password', { current, next }),

    // Registrations
    register: run((classId) => api.post('/registrations', { classId })),
    setRegStatus: run((id, patch) => api.put(`/registrations/${id}/status`, { status: patch.status })),
    dropReg: run((id) => api.del(`/registrations/${id}`)),

    // Grades
    saveGrade: run((studentId, courseId, midterm, finals) =>
      api.put('/grades', { studentId, courseId, midterm, finals })),
  };
}
