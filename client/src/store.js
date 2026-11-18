import { useState } from 'react';
import {
  uid, nextStudentNo, DEFAULT_PASSWORD,
  SEED_TEACHERS, SEED_SUBJECTS, SEED_CLASSES, SEED_STUDENTS, SEED_REGISTRATIONS, SEED_GRADES,
} from './data';

// All data lives in React state for now. Later, swap these actions for API calls.
export function useDB() {
  const [teachers, setTeachers] = useState(SEED_TEACHERS);
  const [subjects, setSubjects] = useState(SEED_SUBJECTS);
  const [classes, setClasses] = useState(SEED_CLASSES);
  const [students, setStudents] = useState(SEED_STUDENTS);
  const [registrations, setRegistrations] = useState(SEED_REGISTRATIONS);
  const [grades, setGrades] = useState(SEED_GRADES);

  const add = (set) => (item) => set((l) => [...l, { ...item, id: uid() }]);
  const edit = (set) => (id, patch) => set((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const del = (set) => (id) => set((l) => l.filter((x) => x.id !== id));

  const addStudents = (items) =>
    setStudents((l) => {
      const list = [...l];
      items.forEach((i) =>
        list.push({ ...i, id: uid(), studentNo: nextStudentNo(list), password: i.password || DEFAULT_PASSWORD })
      );
      return list;
    });

  return {
    teachers, subjects, classes, students, registrations, grades,

    // Teachers
    addTeacher: add(setTeachers),
    editTeacher: edit(setTeachers),
    removeTeacher: del(setTeachers),
    addTeachers: (items) => setTeachers((l) => [...l, ...items.map((i) => ({ ...i, id: uid() }))]),

    // Subjects (deleting one also removes its classes, registrations and grades)
    addSubject: add(setSubjects),
    editSubject: edit(setSubjects),
    addSubjects: (items) => setSubjects((l) => [...l, ...items.map((i) => ({ ...i, id: uid() }))]),
    removeSubject: (id) => {
      const classIds = classes.filter((c) => c.subjectId === id).map((c) => c.id);
      setSubjects((l) => l.filter((s) => s.id !== id));
      setClasses((l) => l.filter((c) => c.subjectId !== id));
      setRegistrations((l) => l.filter((r) => !classIds.includes(r.classId)));
      setGrades((l) => l.filter((g) => g.subjectId !== id));
    },

    // Classes (deleting one also removes its registrations)
    addClass: add(setClasses),
    editClass: edit(setClasses),
    removeClass: (id) => {
      setClasses((l) => l.filter((c) => c.id !== id));
      setRegistrations((l) => l.filter((r) => r.classId !== id));
    },

    // Students (deleting one also removes their registrations and grades)
    addStudents,
    addStudent: (item) => addStudents([item]),
    editStudent: edit(setStudents),
    removeStudent: (id) => {
      setStudents((l) => l.filter((s) => s.id !== id));
      setRegistrations((l) => l.filter((r) => r.studentId !== id));
      setGrades((l) => l.filter((g) => g.studentId !== id));
    },

    // Registrations
    register: (studentId, classId) =>
      setRegistrations((l) => [...l, { id: uid(), studentId, classId, status: 'pending' }]),
    setRegStatus: edit(setRegistrations),
    dropReg: del(setRegistrations),

    // Grades
    saveGrade: (studentId, subjectId, midterm, finals) =>
      setGrades((l) =>
        l.some((g) => g.studentId === studentId && g.subjectId === subjectId)
          ? l.map((g) => (g.studentId === studentId && g.subjectId === subjectId ? { ...g, midterm, finals } : g))
          : [...l, { id: uid(), studentId, subjectId, midterm, finals }]
      ),
  };
}