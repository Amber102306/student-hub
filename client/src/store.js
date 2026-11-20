import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const EMPTY = { students: [], teachers: [], subjects: [], classes: [], registrations: [], grades: [] };
const idOf = (x) => (x && typeof x === 'object' ? x._id : x);

// The server uses _id and populated objects. These turn them into the
// simple shapes the pages already use (id, subjectId, '' for empty grades).
const toStudent = (s, email) => ({
  id: s._id, studentNo: s.studentNo, name: s.name, email: s.email ?? email ?? '',
  phone: s.phone || '', dob: s.dob ? s.dob.slice(0, 10) : '', course: s.course,
});
const toTeacher = (t) => ({ id: t._id, name: t.name, email: t.email, department: t.department });
const toSubject = (s) => ({ id: s._id, code: s.code, name: s.name, units: s.units });
const toClass = (c) => ({
  id: c._id, subjectId: idOf(c.subjectId), teacherId: idOf(c.teacherId),
  section: c.section, day: c.day, start: c.start, end: c.end, room: c.room,
});
const toReg = (r) => ({ id: r._id, studentId: idOf(r.studentId), classId: idOf(r.classId), status: r.status });
const toGrade = (g) => ({
  id: g._id, studentId: idOf(g.studentId), subjectId: idOf(g.subjectId), midterm: g.midterm ?? '', finals: g.finals ?? '',
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
      const [students, teachers, subjects, classes, registrations, grades] = await Promise.all([
        api.get('/students'), api.get('/teachers'), api.get('/subjects'),
        api.get('/classes'), api.get('/registrations'), api.get('/grades'),
      ]);
      setData({
        students: students.map((s) => toStudent(s)),
        teachers: teachers.map(toTeacher),
        subjects: subjects.map(toSubject),
        classes: classes.map(toClass),
        registrations: registrations.map(toReg),
        grades: grades.map(toGrade),
      });
    } else {
      const [me, teachers, subjects, classes, registrations, grades] = await Promise.all([
        api.get('/auth/me'), api.get('/teachers'), api.get('/subjects'),
        api.get('/classes'), api.get('/registrations/mine'), api.get('/grades/mine'),
      ]);
      setData({
        students: [toStudent(me.student, me.user.email)],
        teachers: teachers.map(toTeacher),
        subjects: subjects.map(toSubject),
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

    // Teachers
    addTeacher: run((v) => api.post('/teachers', v)),
    editTeacher: run((id, v) => api.put(`/teachers/${id}`, v)),
    removeTeacher: run((id) => api.del(`/teachers/${id}`)),
    addTeachers: run((list) => api.post('/teachers/bulk', { teachers: list })),

    // Subjects
    addSubject: run((v) => api.post('/subjects', v)),
    editSubject: run((id, v) => api.put(`/subjects/${id}`, v)),
    removeSubject: run((id) => api.del(`/subjects/${id}`)),
    addSubjects: run((list) => api.post('/subjects/bulk', { subjects: list })),

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
    saveGrade: run((studentId, subjectId, midterm, finals) =>
      api.put('/grades', { studentId, subjectId, midterm, finals })),
  };
}
