import { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Book, GraduationCap, ClipboardCheck, Award, Check, X, Edit2, Search,
} from 'lucide-react';
import { Shell, PageHeader, Badge, Modal, Field, EmptyState } from './components';
import CrudPage from './CrudPage';
import {
  COURSES, DAYS, ADMIN, toMin, timeRange, overlaps, fmtDate, gradeOf, finalRating, remarkOf, pct,
} from './data';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9 -]{7,15}$/;
const opts = (list, label) => list.map((x) => ({ value: x.id, label: label(x) }));

export default function AdminPortal({ db, theme, toggleTheme, onLogout, notify }) {
  const [page, setPage] = useState('dashboard');

  const subj = (id) => db.subjects.find((s) => s.id === id);
  const teacher = (id) => db.teachers.find((t) => t.id === id);
  const student = (id) => db.students.find((s) => s.id === id);
  const cls = (id) => db.classes.find((c) => c.id === id);
  const enrolled = (classId) => db.registrations.filter((r) => r.classId === classId && r.status === 'approved').length;
  const pending = db.registrations.filter((r) => r.status === 'pending');
  const classTitle = (c) => `${subj(c.subjectId)?.code} (${c.section})`;

  const sections = [
    { items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Academics',
      items: [
        { key: 'classes', label: 'Classes', icon: BookOpen },
        { key: 'teachers', label: 'Teachers', icon: Users },
        { key: 'students', label: 'Students', icon: GraduationCap },
        { key: 'subjects', label: 'Subjects', icon: Book },
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
  const approve = (r) => {
    const target = cls(r.classId);
    const clash = db.registrations
      .filter((x) => x.studentId === r.studentId && x.status === 'approved' && x.id !== r.id)
      .map((x) => cls(x.classId))
      .find((c) => c && overlaps(c, target));
    if (clash) return notify(`Cannot approve. It overlaps with ${subj(clash.subjectId)?.code} on ${clash.day}.`, 'error');
    db.setRegStatus(r.id, { status: 'approved' });
    notify('Registration approved.');
  };
  const reject = (r) => {
    db.setRegStatus(r.id, { status: 'rejected' });
    notify('Registration rejected.');
  };

  // ----- Validation -----
  const validateStudent = (v, row, batch = []) => {
    if (!EMAIL_RE.test(v.email)) return 'Enter a valid email address.';
    if ([...db.students, ...batch].some((s) => s.id !== row?.id && s.email.toLowerCase() === v.email.toLowerCase()))
      return 'That email is already used by another student.';
    if (v.phone && !PHONE_RE.test(v.phone)) return 'Phone must have 7 to 15 digits.';
    if (v.dob && (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob) || new Date(v.dob) > new Date()))
      return 'Date of birth must be a past date (YYYY-MM-DD).';
    if (!COURSES.includes(v.course)) return 'Pick a course from the list.';
    return null;
  };

  const validateTeacher = (v, row, batch = []) => {
    if (!EMAIL_RE.test(v.email)) return 'Enter a valid email address.';
    if ([...db.teachers, ...batch].some((t) => t.id !== row?.id && t.email.toLowerCase() === v.email.toLowerCase()))
      return 'That email is already used by another teacher.';
    return null;
  };

  const validateSubject = (v, row, batch = []) => {
    if ([...db.subjects, ...batch].some((s) => s.id !== row?.id && s.code.toLowerCase() === v.code.toLowerCase()))
      return 'That subject code already exists.';
    if (!Number.isInteger(v.units) || v.units < 1 || v.units > 6) return 'Units must be a whole number from 1 to 6.';
    return null;
  };

  const validateClass = (v, row) => {
    if (toMin(v.end) <= toMin(v.start)) return 'End time must be after the start time.';
    const cand = { ...v, id: row?.id };
    for (const c of db.classes) {
      if (c.id === cand.id || !overlaps(c, cand)) continue;
      const when = `${c.day} ${timeRange(c)}`;
      if (c.teacherId === v.teacherId) return `Teacher conflict: ${teacher(c.teacherId)?.name} already teaches ${classTitle(c)} on ${when}.`;
      if (c.room.toLowerCase() === v.room.toLowerCase()) return `Room conflict: ${c.room} is already used by ${classTitle(c)} on ${when}.`;
      if (c.section.toLowerCase() === v.section.toLowerCase()) return `Section conflict: ${v.section} already has ${classTitle(c)} on ${when}.`;
    }
    return null;
  };

  // ----- Pages -----
  const renderPage = () => {
    switch (page) {
      case 'dashboard': {
        const perDay = DAYS.map((d) => ({ d, n: db.classes.filter((c) => c.day === d).length }));
        const max = Math.max(1, ...perDay.map((x) => x.n));
        return (
          <>
            <div className="stats-grid">
              <div className="stat-card"><p className="stat-label">Students</p><div className="stat-value">{db.students.length}</div></div>
              <div className="stat-card"><p className="stat-label">Teachers</p><div className="stat-value">{db.teachers.length}</div></div>
              <div className="stat-card"><p className="stat-label">Classes</p><div className="stat-value">{db.classes.length}</div></div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('registrations')} onKeyDown={(e) => e.key === 'Enter' && setPage('registrations')}>
                <p className="stat-label">Pending Registrations</p>
                <div className="stat-value">
                  {pending.length}
                  <Badge status={pending.length ? 'pending' : 'approved'}>{pending.length ? 'Review now' : 'All clear'}</Badge>
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
                                <button className="action-edit" title="Approve" aria-label="Approve" onClick={() => approve(r)}><Check size={16} /></button>
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
                <h3 style={{ marginBottom: '1.5rem' }}>Classes per Day</h3>
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
            searchText={(c) => `${subj(c.subjectId)?.code} ${subj(c.subjectId)?.name} ${teacher(c.teacherId)?.name} ${c.section} ${c.room} ${c.day}`}
            fields={[
              { name: 'subjectId', label: 'Subject', type: 'select', options: opts(db.subjects, (s) => `${s.code} - ${s.name}`) },
              { name: 'teacherId', label: 'Teacher', type: 'select', options: opts(db.teachers, (t) => t.name) },
              { name: 'section', label: 'Section', placeholder: 'BSIT-3A' },
              { name: 'day', label: 'Day', type: 'select', options: DAYS.map((d) => ({ value: d, label: d })) },
              { name: 'start', label: 'Start Time', type: 'time' },
              { name: 'end', label: 'End Time', type: 'time' },
              { name: 'room', label: 'Room', placeholder: 'Room 301' },
            ]}
            columns={[
              { label: 'Subject', render: (c) => <><strong>{subj(c.subjectId)?.code}</strong><br /><small className="muted">{subj(c.subjectId)?.name}</small></> },
              { label: 'Teacher', render: (c) => teacher(c.teacherId)?.name },
              { label: 'Section', render: (c) => c.section },
              { label: 'Day', render: (c) => c.day },
              { label: 'Time', render: (c) => timeRange(c) },
              { label: 'Room', render: (c) => c.room },
              { label: 'Enrolled', render: (c) => enrolled(c.id) },
            ]}
            validate={validateClass}
            onAdd={db.addClass}
            onEdit={db.editClass}
            onDelete={db.removeClass}
            deleteNote={(c) => (enrolled(c.id) ? `${enrolled(c.id)} enrolled student(s) will lose this class.` : '')}
          />
        );

      case 'teachers':
        return (
          <CrudPage
            noun="Teacher" notify={notify} rows={db.teachers}
            searchText={(t) => `${t.name} ${t.email} ${t.department}`}
            fields={[
              { name: 'name', label: 'Full Name', placeholder: 'Prof. Reyes' },
              { name: 'email', label: 'School Email', type: 'email' },
              { name: 'department', label: 'Department' },
            ]}
            columns={[
              { label: 'Name', render: (t) => t.name },
              { label: 'Email', render: (t) => t.email },
              { label: 'Department', render: (t) => t.department },
              { label: 'Classes', render: (t) => db.classes.filter((c) => c.teacherId === t.id).length },
            ]}
            validate={validateTeacher}
            onAdd={db.addTeacher}
            onEdit={db.editTeacher}
            onDelete={db.removeTeacher}
            canDelete={(t) => {
              const n = db.classes.filter((c) => c.teacherId === t.id).length;
              return n ? `${t.name} still teaches ${n} class(es). Reassign or delete those classes first.` : null;
            }}
            bulk={{ fields: ['name', 'email', 'department'], hint: 'Full Name, Email, Department', onImport: db.addTeachers }}
          />
        );

      case 'students':
        return (
          <CrudPage
            noun="Student" notify={notify} rows={db.students}
            searchText={(s) => `${s.name} ${s.studentNo} ${s.email} ${s.phone} ${s.course}`}
            fields={[
              { name: 'name', label: 'Full Name' },
              { name: 'email', label: 'School Email', type: 'email' },
              { name: 'phone', label: 'Phone', optional: true, placeholder: '+639171234567' },
              { name: 'dob', label: 'Date of Birth', type: 'date', optional: true },
              { name: 'course', label: 'Course', type: 'select', default: COURSES[0], options: COURSES.map((c) => ({ value: c, label: c })) },
            ]}
            columns={[
              { label: 'Student No.', render: (s) => s.studentNo },
              { label: 'Name', render: (s) => s.name },
              { label: 'Email', render: (s) => s.email },
              { label: 'Phone', render: (s) => s.phone || '—' },
              { label: 'Date of Birth', render: (s) => fmtDate(s.dob) },
              { label: 'Course', render: (s) => s.course },
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
              defaults: { course: COURSES[0] },
              onImport: db.addStudents,
            }}
          />
        );

      case 'subjects':
        return (
          <CrudPage
            noun="Subject" notify={notify} rows={db.subjects}
            nameOf={(s) => `${s.code} - ${s.name}`}
            searchText={(s) => `${s.code} ${s.name}`}
            fields={[
              { name: 'code', label: 'Subject Code', placeholder: 'IT205' },
              { name: 'name', label: 'Subject Name' },
              { name: 'units', label: 'Units', type: 'number', min: 1, max: 6, step: 1, default: 3 },
            ]}
            columns={[
              { label: 'Code', render: (s) => <strong>{s.code}</strong> },
              { label: 'Name', render: (s) => s.name },
              { label: 'Units', render: (s) => s.units },
              { label: 'Classes', render: (s) => db.classes.filter((c) => c.subjectId === s.id).length },
            ]}
            validate={validateSubject}
            onAdd={(v) => db.addSubject({ ...v, code: v.code.toUpperCase() })}
            onEdit={(id, v) => db.editSubject(id, { ...v, code: v.code.toUpperCase() })}
            onDelete={db.removeSubject}
            deleteNote={(s) => {
              const n = db.classes.filter((c) => c.subjectId === s.id).length;
              return n ? `Its ${n} class(es), registrations and grades will be removed too.` : '';
            }}
            bulk={{
              fields: ['code', 'name', 'units'],
              hint: 'Code, Name, Units',
              onImport: (list) => db.addSubjects(list.map((s) => ({ ...s, code: s.code.toUpperCase() }))),
            }}
          />
        );

      case 'registrations':
        return <RegistrationsPage db={db} student={student} cls={cls} subj={subj} classTitle={classTitle} approve={approve} reject={reject} />;

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
function RegistrationsPage({ db, student, cls, subj, classTitle, approve, reject }) {
  const [tab, setTab] = useState('pending');
  const count = (s) => db.registrations.filter((r) => s === 'all' || r.status === s).length;
  const rows = db.registrations.filter((r) => tab === 'all' || r.status === tab);

  return (
    <>
      <div className="tabs no-print">
        {['pending', 'approved', 'rejected', 'all'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({count(t)})
          </button>
        ))}
      </div>
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Student</th><th>Subject</th><th>Class</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const c = cls(r.classId);
                return (
                  <tr key={r.id}>
                    <td>{student(r.studentId)?.name}<br /><small className="muted">{student(r.studentId)?.studentNo}</small></td>
                    <td>{subj(c.subjectId)?.name}</td>
                    <td>{classTitle(c)}</td>
                    <td>{c.day} {timeRange(c)}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div className="actions-cell">
                        {r.status !== 'approved' && <button className="action-edit" title="Approve" aria-label="Approve" onClick={() => approve(r)}><Check size={16} /></button>}
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
  db.registrations.filter((r) => r.status === 'approved').forEach((r) => {
    const c = db.classes.find((x) => x.id === r.classId);
    if (!c || seen.has(`${r.studentId}|${c.subjectId}`)) return;
    seen.add(`${r.studentId}|${c.subjectId}`);
    rows.push({
      key: `${r.studentId}|${c.subjectId}`,
      student: db.students.find((s) => s.id === r.studentId),
      subject: db.subjects.find((s) => s.id === c.subjectId),
      grade: gradeOf(db.grades, r.studentId, c.subjectId),
    });
  });

  const q = query.trim().toLowerCase();
  const shown = rows.filter((x) => !q || `${x.student?.name} ${x.subject?.code} ${x.subject?.name}`.toLowerCase().includes(q));

  const fields = [
    { name: 'midterm', label: 'Midterm Grade', type: 'number', min: 1, max: 5, step: 0.25, optional: true, hint: '1.00 is the best. 5.00 is the lowest.' },
    { name: 'finals', label: 'Finals Grade', type: 'number', min: 1, max: 5, step: 0.25, optional: true },
  ];

  const openEdit = (x) => {
    setError('');
    setForm({ midterm: x.grade?.midterm ?? '', finals: x.grade?.finals ?? '' });
    setEditing(x);
  };

  const save = (e) => {
    e.preventDefault();
    const vals = ['midterm', 'finals'].map((k) => (form[k] === '' ? '' : Number(form[k])));
    if (vals.some((v) => v !== '' && (Number.isNaN(v) || v < 1 || v > 5))) return setError('Grades must be from 1.00 to 5.00.');
    db.saveGrade(editing.student.id, editing.subject.id, vals[0], vals[1]);
    notify('Grades saved.');
    setEditing(null);
  };

  return (
    <>
      <div className="toolbar no-print">
        <div className="search-bar">
          <input type="text" placeholder="Search student or subject..." aria-label="Search grades" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="btn-icon"><Search size={18} /></div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Student</th><th>Subject</th><th>Midterm</th><th>Finals</th><th>Final Rating</th><th>Remarks</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((x) => {
                const rating = finalRating(x.grade);
                const remark = remarkOf(rating);
                return (
                  <tr key={x.key}>
                    <td>{x.student?.name}</td>
                    <td>{x.subject?.code} <small className="muted">{x.subject?.name}</small></td>
                    <td>{x.grade?.midterm === '' || x.grade == null ? '—' : Number(x.grade.midterm).toFixed(2)}</td>
                    <td>{x.grade?.finals === '' || x.grade == null ? '—' : Number(x.grade.finals).toFixed(2)}</td>
                    <td><strong>{rating == null ? '—' : rating.toFixed(2)}</strong></td>
                    <td>{remark ? <Badge status={remark} /> : '—'}</td>
                    <td><div className="actions-cell"><button className="action-edit" title="Edit grades" aria-label="Edit grades" onClick={() => openEdit(x)}><Edit2 size={16} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && <EmptyState text="No approved registrations yet. Approve a registration to enter grades." />}
        </div>
      </div>

      {editing && (
        <Modal title={`Grades: ${editing.student.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <p style={{ marginBottom: '1rem' }}>{editing.subject.code} - {editing.subject.name}</p>
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