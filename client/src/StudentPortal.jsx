import { useState } from 'react';
import { LayoutDashboard, User, Book, Calendar, FileText, Printer, AlertTriangle, Lock, Edit2 } from 'lucide-react';
import { Shell, PageHeader, Badge, Modal, ConfirmModal, Field, EmptyState, Meetings, Group, GroupToolbar, useGroups } from './components';
import {
  DAYS, MAX_UNITS, dayShort, enrich, classesOverlap, overlapDay, timeRange, toMin, fmtTime, fmtDate, fmtUnits,
  gradeOf, finalRating, remarkOf, daysFromToday, initials, pct, sortMeetings,
} from './data';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'profile', label: 'Student Profile', icon: User },
  { key: 'courses', label: 'Course List', icon: Book },
  { key: 'schedule', label: 'Class Schedule', icon: Calendar },
  { key: 'records', label: 'Academic Records', icon: FileText },
];

export default function StudentPortal({ student, db, theme, toggleTheme, onLogout, notify }) {
  const [page, setPage] = useState('dashboard');
  const [dropTarget, setDropTarget] = useState(null);
  const [profileModal, setProfileModal] = useState(null); // 'edit' | 'password'
  const ui = useGroups(false);

  // ----- Data for this student -----
  const regs = db.registrations
    .filter((r) => r.studentId === student.id)
    .map((r) => ({ ...r, cls: enrich(db, db.classes.find((c) => c.id === r.classId)) }))
    .filter((r) => r.cls?.course);
  const active = regs.filter((r) => r.status !== 'rejected');
  const enrolled = regs.filter((r) => r.status === 'enrolled');
  const pending = regs.filter((r) => r.status === 'pending');
  const unitsLoaded = active.reduce((n, r) => n + r.cls.course.units, 0);
  const weeklyClasses = enrolled.reduce((n, r) => n + r.cls.meetings.length, 0);

  const conflicts = [];
  active.forEach((a, i) => active.slice(i + 1).forEach((b) => classesOverlap(a.cls, b.cls) && conflicts.push([a, b])));
  const conflictIds = new Set(conflicts.flat().map((r) => r.id));

  const rated = enrolled.map((r) => ({ r, rating: finalRating(gradeOf(db.grades, student.id, r.cls.courseId)) }));
  const posted = rated.filter((x) => x.rating != null);
  const unitsPosted = posted.reduce((n, x) => n + x.r.cls.course.units, 0);
  const gwa = unitsPosted ? posted.reduce((n, x) => n + x.rating * x.r.cls.course.units, 0) / unitsPosted : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // ----- Registering for a class -----
  const blockReason = (c) => {
    if (active.some((r) => r.cls.courseId === c.courseId)) return 'Already registered for this course.';
    const clash = active.find((r) => classesOverlap(r.cls, c));
    if (clash) return `Overlaps with ${clash.cls.course.code} on ${overlapDay(clash.cls, c)}.`;
    if (unitsLoaded + c.course.units > MAX_UNITS) return `Over the ${MAX_UNITS}-unit limit.`;
    return null;
  };

  const register = async (c) => {
    const reason = blockReason(c);
    if (reason) return notify(reason, 'error');
    try {
      await db.register(c.id);
      notify('Registration sent. Wait for admin approval.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const confirmDrop = async () => {
    try {
      await db.dropReg(dropTarget.id);
      notify(`${dropTarget.cls.course.code} removed from your list.`);
    } catch (err) {
      notify(err.message, 'error');
    }
    setDropTarget(null);
  };

  const available = db.classes.map((c) => enrich(db, c)).filter((c) => c.course && !active.some((r) => r.classId === c.id));

  // Group the open classes by course, so the list is short and easy to scan.
  const byCourse = {};
  available.forEach((c) => (byCourse[c.courseId] ||= []).push(c));
  const courseGroups = Object.values(byCourse)
    .map((list) => ({ course: list[0].course, list }))
    .sort((a, b) => a.course.code.localeCompare(b.course.code));
  const groupKeys = courseGroups.map((g) => g.course.id);

  // ----- Pages -----
  const renderContent = () => {
    switch (page) {
      case 'dashboard': {
        const upcoming = enrolled
          .flatMap((r) => r.cls.meetings.map((m) => ({ r, m })))
          .sort((a, b) => daysFromToday(a.m.day) - daysFromToday(b.m.day) || toMin(a.m.start) - toMin(b.m.start))
          .slice(0, 4);
        return (
          <>
            <PageHeader title={`${greeting}, ${student.name.split(' ')[0]}`} subtitle={student.program} />

            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Enrolled Courses</p>
                <div className="stat-value">{enrolled.length} <Badge status="enrolled" /></div>
              </div>
              <div className="stat-card">
                <p className="stat-label">Weekly Classes</p>
                <div className="stat-value">{weeklyClasses} <span className="stat-badge badge-blue">This week</span></div>
              </div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('courses')} onKeyDown={(e) => e.key === 'Enter' && setPage('courses')}>
                <p className="stat-label">Pending Registrations</p>
                <div className="stat-value">{pending.length} <Badge status={pending.length ? 'pending' : 'enrolled'}>{pending.length ? 'Awaiting approval' : 'All clear'}</Badge></div>
              </div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('schedule')} onKeyDown={(e) => e.key === 'Enter' && setPage('schedule')}>
                <p className="stat-label">Schedule Conflicts</p>
                <div className="stat-value">{conflicts.length} <Badge status={conflicts.length ? 'rejected' : 'enrolled'}>{conflicts.length ? 'Resolve now' : 'No conflicts'}</Badge></div>
              </div>
            </div>

            <div className="dashboard-columns">
              <div className="table-container" style={{ padding: '1.5rem' }}>
                <div className="card-title-row">
                  <h3>Upcoming Classes</h3>
                  <a href="#" className="link-accent" onClick={(e) => { e.preventDefault(); setPage('schedule'); }}>Full Schedule</a>
                </div>
                {upcoming.length === 0 ? (
                  <EmptyState text="No enrolled classes yet.">
                    <button className="btn-primary btn-sm" style={{ margin: '1rem auto 0' }} onClick={() => setPage('courses')}>Register for classes</button>
                  </EmptyState>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Day</th><th>Course</th><th>Time</th><th>Room</th></tr></thead>
                      <tbody>
                        {upcoming.map(({ r, m }, i) => (
                          <tr key={`${r.id}-${i}`}>
                            <td><strong>{dayShort(m.day)}</strong></td>
                            <td>{r.cls.course.description}<br /><small className="muted">{r.cls.course.code} - {r.cls.section}</small></td>
                            <td>{timeRange(m)}</td>
                            <td>{m.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="table-container" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Semester Progress</h3>
                <Progress label="Units Loaded" value={`${fmtUnits(unitsLoaded)}/${MAX_UNITS}`} width={pct(unitsLoaded, MAX_UNITS)} fill="fill-blue" />
                <Progress label="Courses Enrolled" value={`${enrolled.length}/${active.length}`} width={pct(enrolled.length, active.length)} fill="fill-navy" />
                <Progress label="Grades Posted" value={`${posted.length}/${enrolled.length}`} width={pct(posted.length, enrolled.length)} fill="fill-green" />
                <div style={{ marginTop: '2rem' }}>
                  <p className="muted" style={{ fontSize: '0.875rem' }}>Current GWA</p>
                  <h2 style={{ fontSize: '2rem' }}>{gwa == null ? '—' : gwa.toFixed(2)}</h2>
                </div>
              </div>
            </div>
          </>
        );
      }

      case 'profile':
        return (
          <>
            <PageHeader title="Student Profile">
              <div className="action-buttons">
                <button className="btn-primary" onClick={() => setProfileModal('edit')}><Edit2 size={16} /> Edit Profile</button>
                <button className="btn-secondary" onClick={() => setProfileModal('password')}><Lock size={16} /> Password</button>
              </div>
            </PageHeader>
            <div className="table-container" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <div className="avatar-large">{initials(student.name)}</div>
                <div>
                  <h3 style={{ fontSize: '1.5rem' }}>{student.name}</h3>
                  <p className="muted">{student.program}</p>
                  <p className="muted">{student.studentNo}</p>
                </div>
              </div>
              <div className="info-grid">
                <Info label="Email Address" value={student.email} />
                <Info label="Student Number" value={student.studentNo} />
                <Info label="Phone" value={student.phone || '—'} />
                <Info label="Date of Birth" value={fmtDate(student.dob)} />
                <Info label="Units Loaded" value={`${fmtUnits(unitsLoaded)} of ${MAX_UNITS}`} />
                <Info label="Enrolled Courses" value={enrolled.length} />
              </div>
            </div>
          </>
        );

      case 'courses':
        return (
          <>
            <PageHeader title="Course List" subtitle={`${fmtUnits(unitsLoaded)} of ${MAX_UNITS} units loaded`} />

            <h3 className="section-title">My Courses</h3>
            <div className="table-container">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Course Code</th><th>Course Description</th><th>Section</th><th>Day</th><th>Schedule</th>
                      <th>Room</th><th>Professor</th><th>Status</th><th>Units</th><th className="no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((r) => {
                      const ms = sortMeetings(r.cls.meetings);
                      return (
                        <tr key={r.id}>
                          <td><strong>{r.cls.course.code}</strong></td>
                          <td>{r.cls.course.description}</td>
                          <td>{r.cls.section}</td>
                          <td><div className="stack">{ms.map((m, i) => <div key={i}>{m.day}</div>)}</div></td>
                          <td><div className="stack">{ms.map((m, i) => <div key={i}>{timeRange(m)}</div>)}</div></td>
                          <td><div className="stack">{ms.map((m, i) => <div key={i}>{m.room}</div>)}</div></td>
                          <td>{r.cls.professor?.name}</td>
                          <td><Badge status={r.status} /></td>
                          <td>{fmtUnits(r.cls.course.units)}</td>
                          <td className="no-print">
                            <button className="btn-danger btn-sm" onClick={() => setDropTarget(r)}>{r.status === 'rejected' ? 'Remove' : 'Drop'}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {regs.length === 0 && <EmptyState text="You have no courses yet. Register for a class below." />}
              </div>
            </div>

            <h3 className="section-title">Available Classes</h3>
            {courseGroups.length === 0 ? (
              <div className="table-container"><EmptyState text="No other classes are open right now." /></div>
            ) : (
              <>
                <GroupToolbar
                  label={`${available.length} class(es) in ${courseGroups.length} course(s)`}
                  onExpand={() => ui.setAll(groupKeys, true)}
                  onCollapse={() => ui.setAll(groupKeys, false)}
                />
                {courseGroups.map(({ course, list }) => (
                  <Group
                    key={course.id}
                    title={`${course.code} - ${course.description}`}
                    subtitle={`${fmtUnits(course.units)} units`}
                    meta={<span className="count-pill">{list.length} section(s)</span>}
                    open={ui.isOpen(course.id)}
                    onToggle={() => ui.toggle(course.id)}
                  >
                    <div className="table-scroll">
                      <table>
                        <thead><tr><th>Section</th><th>Professor</th><th>Schedule</th><th>Action</th></tr></thead>
                        <tbody>
                          {list.map((c) => {
                            const reason = blockReason(c);
                            return (
                              <tr key={c.id}>
                                <td><strong>{c.section}</strong></td>
                                <td>{c.professor?.name}</td>
                                <td><Meetings meetings={c.meetings} /></td>
                                <td>
                                  <button className="btn-primary btn-sm" disabled={!!reason} onClick={() => register(c)}>Register</button>
                                  {reason && <small className="muted block">{reason}</small>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Group>
                ))}
              </>
            )}
          </>
        );

      case 'schedule': {
        const slots = active.flatMap((r) => r.cls.meetings.map((m) => ({ r, m })));
        const starts = [...new Set(slots.map((x) => x.m.start))].sort((a, b) => toMin(a) - toMin(b));
        return (
          <>
            <PageHeader title="Class Schedule" subtitle="Dashed blocks are waiting for approval.">
              <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            </PageHeader>

            {conflicts.length > 0 && (
              <div className="alert alert-danger" role="alert">
                <AlertTriangle size={18} />
                <div style={{ flex: 1 }}>
                  <strong>{conflicts.length} schedule conflict(s).</strong> Drop one course in each pair to fix it.
                  {conflicts.map(([a, b]) => (
                    <div key={a.id + b.id} className="conflict-row">
                      <span>{a.cls.course.code} and {b.cls.course.code} overlap on {overlapDay(a.cls, b.cls)}.</span>
                      <span className="no-print">
                        <button className="btn-danger btn-sm" onClick={() => setDropTarget(a)}>Drop {a.cls.course.code}</button>{' '}
                        <button className="btn-danger btn-sm" onClick={() => setDropTarget(b)}>Drop {b.cls.course.code}</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-container" style={{ padding: '1.5rem' }}>
              {slots.length === 0 ? (
                <EmptyState text="Your schedule is empty. Register for classes to see them here." />
              ) : (
                <div className="table-scroll">
                  <table className="schedule-table">
                    <thead><tr><th>Time</th>{DAYS.map((d) => <th key={d}>{dayShort(d)}</th>)}</tr></thead>
                    <tbody>
                      {starts.map((s) => (
                        <tr key={s}>
                          <td><strong>{fmtTime(s)}</strong></td>
                          {DAYS.map((d) => (
                            <td key={d}>
                              {slots.filter((x) => x.m.day === d && x.m.start === s).map(({ r, m }) => (
                                <div key={r.id} className={`schedule-block ${r.status === 'pending' ? 'pending' : ''} ${conflictIds.has(r.id) ? 'conflict' : ''}`}>
                                  <strong>{r.cls.course.code}</strong><br />
                                  {r.cls.course.description}<br />
                                  <small>{timeRange(m)} - {m.room}</small><br />
                                  <small>{r.cls.section}</small>
                                </div>
                              ))}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );
      }

      case 'records':
        return (
          <>
            <PageHeader title="Academic Records" subtitle="Grades use a 1.00 (best) to 5.00 scale. 3.00 or better is passing.">
              <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            </PageHeader>
            <div className="table-container">
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Course</th><th>Units</th><th>Midterm Grade</th><th>Finals Grade</th><th>Final Rating</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {rated.map(({ r, rating }) => {
                      const g = gradeOf(db.grades, student.id, r.cls.courseId);
                      const show = (v) => (v === '' || v == null ? '—' : Number(v).toFixed(2));
                      const remark = remarkOf(rating);
                      return (
                        <tr key={r.id}>
                          <td>{r.cls.course.description}<br /><small className="muted">{r.cls.course.code}</small></td>
                          <td>{fmtUnits(r.cls.course.units)}</td>
                          <td>{show(g?.midterm)}</td>
                          <td>{show(g?.finals)}</td>
                          <td><strong>{show(rating)}</strong></td>
                          <td>{remark ? <Badge status={remark} /> : <span className="muted">Not posted</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {gwa != null && (
                    <tfoot>
                      <tr><td colSpan="4"><strong>General Weighted Average (GWA)</strong></td><td colSpan="2"><strong>{gwa.toFixed(2)}</strong></td></tr>
                    </tfoot>
                  )}
                </table>
                {rated.length === 0 && <EmptyState text="No records yet. Grades appear here after you are enrolled in a course." />}
              </div>
            </div>
          </>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Shell
      brand="AttendX Student" userLabel={student.name} sections={[{ items: NAV.map((n) => (n.key === 'courses' ? { ...n, count: pending.length } : n)) }]}
      active={page} onNav={setPage} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout}
    >
      {renderContent()}

      {dropTarget && (
        <ConfirmModal
          title={dropTarget.status === 'rejected' ? 'Remove Course' : 'Drop Course'}
          confirmLabel={dropTarget.status === 'rejected' ? 'Remove' : 'Drop'}
          message={<p>Do you want to {dropTarget.status === 'rejected' ? 'remove' : 'drop'} <strong>{dropTarget.cls.course.code} - {dropTarget.cls.course.description}</strong>? You can register again later.</p>}
          onConfirm={confirmDrop}
          onClose={() => setDropTarget(null)}
        />
      )}
      {profileModal === 'edit' && <EditProfileModal student={student} db={db} notify={notify} onClose={() => setProfileModal(null)} />}
      {profileModal === 'password' && <PasswordModal db={db} notify={notify} onClose={() => setProfileModal(null)} />}
    </Shell>
  );
}

// ---------- small pieces ----------
const Progress = ({ label, value, width, fill }) => (
  <div className="progress-group">
    <div className="progress-label"><span>{label}</span><span>{value}</span></div>
    <div className="progress-bar"><div className={`progress-fill ${fill}`} style={{ width: `${width}%` }} /></div>
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontWeight: 500 }}>{value}</p>
  </div>
);

function EditProfileModal({ student, db, notify, onClose }) {
  const [form, setForm] = useState({ name: student.name, phone: student.phone || '', dob: student.dob || '' });
  const [error, setError] = useState('');
  const fields = [
    { name: 'name', label: 'Full Name' },
    { name: 'phone', label: 'Phone', optional: true, placeholder: '+639171234567' },
    { name: 'dob', label: 'Date of Birth', type: 'date', optional: true },
  ];
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (form.phone && !/^\+?[0-9 -]{7,15}$/.test(form.phone)) return setError('Phone must have 7 to 15 digits.');
    if (form.dob && new Date(form.dob) > new Date()) return setError('Date of birth must be a past date.');
    try {
      await db.updateMyProfile({ name: form.name.trim(), phone: form.phone.trim(), dob: form.dob });
      notify('Profile updated.');
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        {fields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} />)}
        <p className="form-hint">Email, program and student number can only be changed by the admin.</p>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ db, notify, onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const fields = [
    { name: 'current', label: 'Current Password', type: 'password', autoComplete: 'current-password' },
    { name: 'next', label: 'New Password', type: 'password', autoComplete: 'new-password', hint: 'At least 8 characters.' },
    { name: 'confirm', label: 'Confirm New Password', type: 'password', autoComplete: 'new-password' },
  ];
  const submit = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) return setError('New password must have at least 8 characters.');
    if (form.next === form.current) return setError('New password must be different from the current one.');
    if (form.next !== form.confirm) return setError('New passwords do not match.');
    try {
      await db.changePassword(form.current, form.next); // the server checks the current password
      notify('Password changed.');
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        {fields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} />)}
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Change Password</button>
        </div>
      </form>
    </Modal>
  );
}