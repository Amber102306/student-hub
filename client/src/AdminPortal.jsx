import { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Book, GraduationCap, ClipboardCheck, Award, Check, X, Edit2, Search,
} from 'lucide-react';
import { Shell, PageHeader, Badge, Modal, Field, EmptyState, Meetings } from './components';
import CrudPage from './CrudPage';
import {
  PROGRAMS, DAYS, ADMIN, SECTION_RE, toMin, timeRange, meetingsOverlap, classesOverlap, fmtDate, fmtUnits,
  gradeOf, finalRating, remarkOf, pct,
} from './data';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9 -]{7,15}$/;
const opts = (list, label) => list.map((x) => ({ value: x.id, label: label(x) }));

export default function AdminPortal({ db, theme, toggleTheme, onLogout, notify }) {
  const [page, setPage] = useState('dashboard');

  const course = (id) => db.courses.find((c) => c.id === id);
  const professor = (id) => db.professors.find((p) => p.id === id);
  const student = (id) => db.students.find((s) => s.id === id);
  const cls = (id) => db.classes.find((c) => c.id === id);
  const enrolledCount = (classId) => db.registrations.filter((r) => r.classId === classId && r.status === 'enrolled').length;
  const pending = db.registrations.filter((r) => r.status === 'pending');
  const classTitle = (c) => `${course(c.courseId)?.code} (${c.section})`;

  const sections = [
    { items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Academics',
      items: [
        { key: 'classes', label: 'Classes', icon: BookOpen },
        { key: 'professors', label: 'Professors', icon: Users },
        { key: 'students', label: 'Students', icon: GraduationCap },
        { key: 'courses', label: 'Courses', icon: Book },
      ],
    },
    {
      label: 'Enrollment',
      items: [
        { key: 'registrations', label: 'Registrations', icon: ClipboardCheck, count: pending.length },
        { key: 'grades', label: 'Grades', icon: Award },
      ],
    },
  ];
  const title = sections.flatMap((s) => s.items).find((i) => i.key === page).label;

  // ----- Registration actions -----
  const enroll = async (r) => {
    const target = cls(r.classId);
    const clash = db.registrations
      .filter((x) => x.studentId === r.studentId && x.status === 'enrolled' && x.id !== r.id)
      .map((x) => cls(x.classId))
      .find((c) => c && classesOverlap(c, target));
    if (clash) return notify(`Cannot enroll. It overlaps with ${course(clash.courseId)?.code} (${clash.section}).`, 'error');
    try {
      await db.setRegStatus(r.id, { status: 'enrolled' });
      notify('Student enrolled.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };
  const reject = async (r) => {
    try {
      await db.setRegStatus(r.id, { status: 'rejected' });
      notify('Registration rejected.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // ----- Validation -----
  const validateStudent = (v, row, batch = []) => {
    if (!EMAIL_RE.test(v.email)) return 'Enter a valid email address.';
    if ([...db.students, ...batch].some((s) => s.id !== row?.id && s.email.toLowerCase() === v.email.toLowerCase()))
      return 'That email is already used by another student.';
    if (v.phone && !PHONE_RE.test(v.phone)) return 'Phone must have 7 to 15 digits.';
    if (v.dob && (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob) || new Date(v.dob) > new Date()))
      return 'Date of birth must be a past date (YYYY-MM-DD).';
    if (!PROGRAMS.includes(v.program)) return 'Pick a program from the list.';
    return null;
  };

  const validateProfessor = (v, row, batch = []) => {
    if (!EMAIL_RE.test(v.email)) return 'Enter a valid email address.';
    if ([...db.professors, ...batch].some((p) => p.id !== row?.id && p.email.toLowerCase() === v.email.toLowerCase()))
      return 'That email is already used by another professor.';
    return null;
  };

  const validateCourse = (v, row, batch = []) => {
    if ([...db.courses, ...batch].some((c) => c.id !== row?.id && c.code.toLowerCase() === v.code.toLowerCase()))
      return 'That course code already exists.';
    if (!(v.units >= 1 && v.units <= 6 && (v.units * 2) % 1 === 0)) return 'Units must be from 1.0 to 6.0 (steps of 0.5).';
    return null;
  };

  const validateClass = (v, row) => {
    const section = v.section.toUpperCase();
    if (!SECTION_RE.test(section)) return 'Section must be 3 letters and 3 numbers, like COM241 or COM242.';
    if (!v.meetings.length) return 'Add at least one time slot.';
    for (const m of v.meetings) {
      if (!m.start || !m.end || !m.room.trim()) return 'Fill in the day, times and room of every time slot.';
      if (toMin(m.end) <= toMin(m.start)) return `End time must be after the start time (${m.day}).`;
    }
    for (let i = 0; i < v.meetings.length; i += 1)
      for (let j = i + 1; j < v.meetings.length; j += 1)
        if (meetingsOverlap(v.meetings[i], v.meetings[j])) return 'Two of your time slots overlap each other.';

    for (const c of db.classes) {
      if (c.id === row?.id) continue;
      for (const a of c.meetings) {
        for (const b of v.meetings) {
          if (!meetingsOverlap(a, b)) continue;
          const where = `${classTitle(c)} on ${a.day} ${timeRange(a)}`;
          if (c.professorId === v.professorId) return `Professor conflict: ${professor(c.professorId)?.name} already teaches ${where}.`;
          if (a.room.toLowerCase() === b.room.trim().toLowerCase()) return `Room conflict: ${a.room} is used by ${where}.`;
          if (c.section === section) return `Section conflict: ${section} already has ${where}.`;
        }
      }
    }
    return null;
  };

  const normClass = (v) => ({
    ...v,
    section: v.section.toUpperCase(),
    meetings: v.meetings.map((m) => ({ ...m, room: m.room.trim() })),
  });

  // ----- Pages -----
  const renderPage = () => {
    switch (page) {
      case 'dashboard': {
        const allMeetings = db.classes.flatMap((c) => c.meetings);
        const perDay = DAYS.map((d) => ({ d, n: allMeetings.filter((m) => m.day === d).length }));
        const max = Math.max(1, ...perDay.map((x) => x.n));
        return (
          <>
            <div className="stats-grid">
              <div className="stat-card"><p className="stat-label">Students</p><div className="stat-value">{db.students.length}</div></div>
              <div className="stat-card"><p className="stat-label">Professors</p><div className="stat-value">{db.professors.length}</div></div>
              <div className="stat-card"><p className="stat-label">Courses</p><div className="stat-value">{db.courses.length}</div></div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('registrations')} onKeyDown={(e) => e.key === 'Enter' && setPage('registrations')}>
                <p className="stat-label">Pending Registrations</p>
                <div className="stat-value">
                  {pending.length}
                  <Badge status={pending.length ? 'pending' : 'enrolled'}>{pending.length ? 'Review now' : 'All clear'}</Badge>
                </div>
              </div>
            </div>

            <div className="dashboard-columns">
              <div className="table-container" style={{ padding: '1.5rem' }}>
                <div className="card-title-row">
                  <h3>Pending Registrations</h3>
                  <a href="#" className="link-accent" onClick={(e) => { e.preventDefault(); setPage('registrations'); }}>View all</a>
                </div>
                {pending.length === 0 ? (
                  <EmptyState text="No registrations are waiting for approval." />
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Student</th><th>Class</th><th>Actions</th></tr></thead>
                      <tbody>
                        {pending.slice(0, 5).map((r) => (
                          <tr key={r.id}>
                            <td>{student(r.studentId)?.name}</td>
                            <td>{classTitle(cls(r.classId))}</td>
                            <td>
                              <div className="actions-cell">
                                <button className="action-edit" title="Enroll" aria-label="Enroll" onClick={() => enroll(r)}><Check size={16} /></button>
                                <button className="action-delete" title="Reject" aria-label="Reject" onClick={() => reject(r)}><X size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="table-container" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Class Meetings per Day</h3>
                {perDay.map(({ d, n }) => (
                  <div className="progress-group" key={d}>
                    <div className="progress-label"><span>{d}</span><span>{n}</span></div>
                    <div className="progress-bar"><div className="progress-fill fill-green" style={{ width: `${pct(n, max)}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      }

      case 'classes':
        return (
          <CrudPage
            noun="Class" notify={notify} rows={db.classes}
            nameOf={(c) => classTitle(c)}
            searchText={(c) => `${course(c.courseId)?.code} ${course(c.courseId)?.description} ${professor(c.professorId)?.name} ${c.section} ${c.meetings.map((m) => `${m.day} ${m.room}`).join(' ')}`}
            fields={[
              { name: 'courseId', label: 'Course', type: 'select', options: opts(db.courses, (c) => `${c.code} - ${c.description}`) },
              { name: 'section', label: 'Section', placeholder: 'COM241', hint: 'Examples: COM241, COM242' },
              { name: 'professorId', label: 'Professor', type: 'select', options: opts(db.professors, (p) => p.name) },
              {
                name: 'meetings', label: 'Schedule', type: 'meetings',
                default: [{ day: 'Monday', start: '', end: '', room: '' }],
                hint: 'Add one time slot for each meeting in the week. Each slot can have its own time and room.',
              },
            ]}
            columns={[
              { label: 'Course Code', render: (c) => <strong>{course(c.courseId)?.code}</strong> },
              { label: 'Course Description', render: (c) => course(c.courseId)?.description },
              { label: 'Section', render: (c) => c.section },
              { label: 'Schedule', render: (c) => <Meetings meetings={c.meetings} /> },
              { label: 'Professor', render: (c) => professor(c.professorId)?.name },
              { label: 'Units', render: (c) => fmtUnits(course(c.courseId)?.units ?? 0) },
              { label: 'Enrolled', render: (c) => enrolledCount(c.id) },
            ]}
            validate={validateClass}
            onAdd={(v) => db.addClass(normClass(v))}
            onEdit={(id, v) => db.editClass(id, normClass(v))}
            onDelete={db.removeClass}
            deleteNote={(c) => (enrolledCount(c.id) ? `${enrolledCount(c.id)} enrolled student(s) will lose this class.` : '')}
          />
        );

      case 'professors':
        return (
          <CrudPage
            noun="Professor" notify={notify} rows={db.professors}
            searchText={(p) => `${p.name} ${p.email} ${p.department}`}
            fields={[
              { name: 'name', label: 'Full Name', placeholder: 'Mr. Juan A. Dela Cruz', hint: 'Include the title (Mr., Ms., Dr.).' },
              { name: 'email', label: 'School Email', type: 'email' },
              { name: 'department', label: 'Department' },
            ]}
            columns={[
              { label: 'Name', render: (p) => p.name },
              { label: 'Email', render: (p) => p.email },
              { label: 'Department', render: (p) => p.department },
              { label: 'Classes', render: (p) => db.classes.filter((c) => c.professorId === p.id).length },
            ]}
            validate={validateProfessor}
            onAdd={db.addProfessor}
            onEdit={db.editProfessor}
            onDelete={db.removeProfessor}
            canDelete={(p) => {
              const n = db.classes.filter((c) => c.professorId === p.id).length;
              return n ? `${p.name} still teaches ${n} class(es). Reassign or delete those classes first.` : null;
            }}
            bulk={{ fields: ['name', 'email', 'department'], hint: 'Full Name, Email, Department', onImport: db.addProfessors }}
          />
        );

      case 'students':
        return (
          <CrudPage
            noun="Student" notify={notify} rows={db.students}
            searchText={(s) => `${s.name} ${s.studentNo} ${s.email} ${s.phone} ${s.program}`}
            fields={[
              { name: 'name', label: 'Full Name' },
              { name: 'email', label: 'School Email', type: 'email' },
              { name: 'phone', label: 'Phone', optional: true, placeholder: '+639171234567' },
              { name: 'dob', label: 'Date of Birth', type: 'date', optional: true },
              { name: 'program', label: 'Program', type: 'select', default: PROGRAMS[0], options: PROGRAMS.map((p) => ({ value: p, label: p })) },
            ]}
            columns={[
              { label: 'Student No.', render: (s) => s.studentNo },
              { label: 'Name', render: (s) => s.name },
              { label: 'Email', render: (s) => s.email },
              { label: 'Phone', render: (s) => s.phone || '—' },
              { label: 'Date of Birth', render: (s) => fmtDate(s.dob) },
              { label: 'Program', render: (s) => s.program },
            ]}
            validate={validateStudent}
            onAdd={db.addStudent}
            onEdit={db.editStudent}
            onDelete={db.removeStudent}
            deleteNote={(s) => {
              const n = db.registrations.filter((r) => r.studentId === s.id).length;
              return n ? `Their ${n} registration(s) and grades will be removed too.` : '';
            }}
            bulk={{
              fields: ['name', 'email', 'phone', 'dob'],
              hint: 'Full Name, Email, Phone, Date of Birth (YYYY-MM-DD)',
              note: 'Student numbers are created automatically. The default password is Welcome123.',
              defaults: { program: PROGRAMS[0] },
              onImport: db.addStudents,
            }}
          />
        );

      case 'courses':
        return (
          <CrudPage
            noun="Course" notify={notify} rows={db.courses}
            nameOf={(c) => `${c.code} - ${c.description}`}
            searchText={(c) => `${c.code} ${c.description}`}
            fields={[
              { name: 'code', label: 'Course Code', placeholder: 'CCDIGFOL' },
              { name: 'description', label: 'Course Description', placeholder: 'INTRODUCTION TO DIGITAL FORENSICS' },
              { name: 'units', label: 'Units', type: 'number', min: 1, max: 6, step: 0.5, default: 3 },
            ]}
            columns={[
              { label: 'Course Code', render: (c) => <strong>{c.code}</strong> },
              { label: 'Course Description', render: (c) => c.description },
              { label: 'Units', render: (c) => fmtUnits(c.units) },
              { label: 'Classes', render: (c) => db.classes.filter((x) => x.courseId === c.id).length },
            ]}
            validate={validateCourse}
            onAdd={(v) => db.addCourse({ ...v, code: v.code.toUpperCase(), description: v.description.toUpperCase() })}
            onEdit={(id, v) => db.editCourse(id, { ...v, code: v.code.toUpperCase(), description: v.description.toUpperCase() })}
            onDelete={db.removeCourse}
            deleteNote={(c) => {
              const n = db.classes.filter((x) => x.courseId === c.id).length;
              return n ? `Its ${n} class(es), registrations and grades will be removed too.` : '';
            }}
            bulk={{
              fields: ['code', 'description', 'units'],
              hint: 'Course Code, Course Description, Units',
              onImport: (list) => db.addCourses(list.map((c) => ({ ...c, code: c.code.toUpperCase(), description: c.description.toUpperCase() }))),
            }}
          />
        );

      case 'registrations':
        return <RegistrationsPage db={db} student={student} cls={cls} course={course} professor={professor} enroll={enroll} reject={reject} />;

      case 'grades':
        return <GradesPage db={db} notify={notify} />;

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Shell
      brand="AttendX Admin" userLabel={ADMIN.name} sections={sections} active={page} onNav={setPage}
      theme={theme} toggleTheme={toggleTheme} onLogout={onLogout}
    >
      <PageHeader title={title} />
      {renderPage()}
    </Shell>
  );
}

// ---------------- Registrations ----------------
function RegistrationsPage({ db, student, cls, course, professor, enroll, reject }) {
  const [tab, setTab] = useState('pending');
  const count = (s) => db.registrations.filter((r) => s === 'all' || r.status === s).length;
  const rows = db.registrations.filter((r) => tab === 'all' || r.status === tab);

  return (
    <>
      <div className="tabs no-print">
        {['pending', 'enrolled', 'rejected', 'all'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({count(t)})
          </button>
        ))}
      </div>
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Student</th><th>Course</th><th>Section</th><th>Schedule</th><th>Professor</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const c = cls(r.classId);
                return (
                  <tr key={r.id}>
                    <td>{student(r.studentId)?.name}<br /><small className="muted">{student(r.studentId)?.studentNo}</small></td>
                    <td><strong>{course(c.courseId)?.code}</strong><br /><small className="muted">{course(c.courseId)?.description}</small></td>
                    <td>{c.section}</td>
                    <td><Meetings meetings={c.meetings} /></td>
                    <td>{professor(c.professorId)?.name}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div className="actions-cell">
                        {r.status !== 'enrolled' && <button className="action-edit" title="Enroll" aria-label="Enroll" onClick={() => enroll(r)}><Check size={16} /></button>}
                        {r.status !== 'rejected' && <button className="action-delete" title="Reject" aria-label="Reject" onClick={() => reject(r)}><X size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState text={`No ${tab === 'all' ? '' : tab + ' '}registrations.`} />}
        </div>
      </div>
    </>
  );
}

// ---------------- Grades ----------------
function GradesPage({ db, notify }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ midterm: '', finals: '' });
  const [error, setError] = useState('');

  const seen = new Set();
  const rows = [];
  db.registrations.filter((r) => r.status === 'enrolled').forEach((r) => {
    const c = db.classes.find((x) => x.id === r.classId);
    if (!c || seen.has(`${r.studentId}|${c.courseId}`)) return;
    seen.add(`${r.studentId}|${c.courseId}`);
    rows.push({
      key: `${r.studentId}|${c.courseId}`,
      student: db.students.find((s) => s.id === r.studentId),
      course: db.courses.find((x) => x.id === c.courseId),
      grade: gradeOf(db.grades, r.studentId, c.courseId),
    });
  });

  const q = query.trim().toLowerCase();
  const shown = rows.filter((x) => !q || `${x.student?.name} ${x.course?.code} ${x.course?.description}`.toLowerCase().includes(q));

  const fields = [
    { name: 'midterm', label: 'Midterm Grade', type: 'number', min: 1, max: 5, step: 0.25, optional: true, hint: '1.00 is the best. 5.00 is the lowest.' },
    { name: 'finals', label: 'Finals Grade', type: 'number', min: 1, max: 5, step: 0.25, optional: true },
  ];

  const openEdit = (x) => {
    setError('');
    setForm({ midterm: x.grade?.midterm ?? '', finals: x.grade?.finals ?? '' });
    setEditing(x);
  };

  const save = async (e) => {
    e.preventDefault();
    const vals = ['midterm', 'finals'].map((k) => (form[k] === '' ? '' : Number(form[k])));
    if (vals.some((v) => v !== '' && (Number.isNaN(v) || v < 1 || v > 5))) return setError('Grades must be from 1.00 to 5.00.');
    try {
      await db.saveGrade(editing.student.id, editing.course.id, vals[0], vals[1]);
      notify('Grades saved.');
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="toolbar no-print">
        <div className="search-bar">
          <input type="text" placeholder="Search student or course..." aria-label="Search grades" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="btn-icon"><Search size={18} /></div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Student</th><th>Course</th><th>Midterm</th><th>Finals</th><th>Final Rating</th><th>Remarks</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((x) => {
                const rating = finalRating(x.grade);
                const remark = remarkOf(rating);
                const show = (v) => (v === '' || v == null ? '—' : Number(v).toFixed(2));
                return (
                  <tr key={x.key}>
                    <td>{x.student?.name}</td>
                    <td><strong>{x.course?.code}</strong><br /><small className="muted">{x.course?.description}</small></td>
                    <td>{show(x.grade?.midterm)}</td>
                    <td>{show(x.grade?.finals)}</td>
                    <td><strong>{rating == null ? '—' : rating.toFixed(2)}</strong></td>
                    <td>{remark ? <Badge status={remark} /> : '—'}</td>
                    <td><div className="actions-cell"><button className="action-edit" title="Edit grades" aria-label="Edit grades" onClick={() => openEdit(x)}><Edit2 size={16} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && <EmptyState text="No enrolled students yet. Enroll a student to enter grades." />}
        </div>
      </div>

      {editing && (
        <Modal title={`Grades: ${editing.student.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <p style={{ marginBottom: '1rem' }}>{editing.course.code} - {editing.course.description}</p>
            {error && <div className="form-error" role="alert">{error}</div>}
            {fields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} />)}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Grades</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
