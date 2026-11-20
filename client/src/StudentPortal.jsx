 import { useState } from 'react';
import { LayoutDashboard, User, Book, Calendar, FileText, Printer, AlertTriangle, Lock, Edit2 } from 'lucide-react';
import { Shell, PageHeader, Badge, Modal, ConfirmModal, Field, EmptyState } from './components';
import {
  DAYS, MAX_UNITS, enrich, overlaps, timeRange, toMin, fmtTime, fmtDate, gradeOf, finalRating, remarkOf,
  daysFromToday, initials, pct,
} from './data';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'profile', label: 'Student Profile', icon: User },
  { key: 'subjects', label: 'Subject List', icon: Book },
  { key: 'schedule', label: 'Class Schedule', icon: Calendar },
  { key: 'records', label: 'Academic Records', icon: FileText },
];

export default function StudentPortal({ student, db, theme, toggleTheme, onLogout, notify }) {
  const [page, setPage] = useState('dashboard');
  const [dropTarget, setDropTarget] = useState(null);
  const [profileModal, setProfileModal] = useState(null); // 'edit' | 'password'

  // ----- Data for this student -----
  const regs = db.registrations
    .filter((r) => r.studentId === student.id)
    .map((r) => ({ ...r, cls: enrich(db, db.classes.find((c) => c.id === r.classId)) }))
    .filter((r) => r.cls?.subject);
  const active = regs.filter((r) => r.status !== 'rejected');
  const approved = regs.filter((r) => r.status === 'approved');
  const pending = regs.filter((r) => r.status === 'pending');
  const unitsLoaded = active.reduce((n, r) => n + r.cls.subject.units, 0);

  const conflicts = [];
  active.forEach((a, i) => active.slice(i + 1).forEach((b) => overlaps(a.cls, b.cls) && conflicts.push([a, b])));
  const conflictIds = new Set(conflicts.flat().map((r) => r.id));

  const rated = approved.map((r) => ({ r, rating: finalRating(gradeOf(db.grades, student.id, r.cls.subjectId)) }));
  const posted = rated.filter((x) => x.rating != null);
  const unitsPosted = posted.reduce((n, x) => n + x.r.cls.subject.units, 0);
  const gwa = unitsPosted ? posted.reduce((n, x) => n + x.rating * x.r.cls.subject.units, 0) / unitsPosted : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // ----- Registering for a class -----
  const blockReason = (c) => {
    if (active.some((r) => r.cls.subjectId === c.subjectId)) return 'Already registered for this subject.';
    const clash = active.find((r) => overlaps(r.cls, c));
    if (clash) return `Overlaps with ${clash.cls.subject.code} on ${clash.cls.day}.`;
    if (unitsLoaded + c.subject.units > MAX_UNITS) return `Over the ${MAX_UNITS}-unit limit.`;
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
      notify(`${dropTarget.cls.subject.code} removed from your list.`);
    } catch (err) {
      notify(err.message, 'error');
    }
    setDropTarget(null);
  };

  const available = db.classes.map((c) => enrich(db, c)).filter((c) => c.subject && !active.some((r) => r.classId === c.id));

  // ----- Pages -----
  const renderContent = () => {
    switch (page) {
      case 'dashboard': {
        const upcoming = approved
          .slice()
          .sort((a, b) => daysFromToday(a.cls.day) - daysFromToday(b.cls.day) || toMin(a.cls.start) - toMin(b.cls.start))
          .slice(0, 4);
        return (
          <>
            <PageHeader title={`${greeting}, ${student.name.split(' ')[0]}`} subtitle={student.course} />

            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Registered Courses</p>
                <div className="stat-value">{approved.length} <Badge status="approved">Approved</Badge></div>
              </div>
              <div className="stat-card">
                <p className="stat-label">Weekly Classes</p>
                <div className="stat-value">{approved.length} <span className="stat-badge badge-blue">This week</span></div>
              </div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('subjects')} onKeyDown={(e) => e.key === 'Enter' && setPage('subjects')}>
                <p className="stat-label">Pending Registrations</p>
                <div className="stat-value">{pending.length} <Badge status={pending.length ? 'pending' : 'approved'}>{pending.length ? 'Awaiting approval' : 'All clear'}</Badge></div>
              </div>
              <div className="stat-card clickable" role="button" tabIndex={0} onClick={() => setPage('schedule')} onKeyDown={(e) => e.key === 'Enter' && setPage('schedule')}>
                <p className="stat-label">Schedule Conflicts</p>
                <div className="stat-value">{conflicts.length} <Badge status={conflicts.length ? 'rejected' : 'approved'}>{conflicts.length ? 'Resolve now' : 'No conflicts'}</Badge></div>
              </div>
            </div>

            <div className="dashboard-columns">
              <div className="table-container" style={{ padding: '1.5rem' }}>
                <div className="card-title-row">
                  <h3>Upcoming Classes</h3>
                  <a href="#" className="link-accent" onClick={(e) => { e.preventDefault(); setPage('schedule'); }}>Full Schedule</a>
                </div>
                {upcoming.length === 0 ? (
                  <EmptyState text="No approved classes yet.">
                    <button className="btn-primary btn-sm" style={{ margin: '1rem auto 0' }} onClick={() => setPage('subjects')}>Register for classes</button>
                  </EmptyState>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Day</th><th>Subject</th><th>Time</th><th>Room</th></tr></thead>
                      <tbody>
                        {upcoming.map((r) => (
                          <tr key={r.id}>
                            <td><strong>{r.cls.day}</strong></td>
                            <td>{r.cls.subject.name}<br /><small className="muted">{r.cls.subject.code}</small></td>
                            <td>{timeRange(r.cls)}</td>
                            <td>{r.cls.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="table-container" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Semester Progress</h3>
                <Progress label="Units Loaded" value={`${unitsLoaded}/${MAX_UNITS}`} width={pct(unitsLoaded, MAX_UNITS)} fill="fill-blue" />
                <Progress label="Registrations Approved" value={`${approved.length}/${active.length}`} width={pct(approved.length, active.length)} fill="fill-navy" />
                <Progress label="Grades Posted" value={`${posted.length}/${approved.length}`} width={pct(posted.length, approved.length)} fill="fill-green" />
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
                  <p className="muted">{student.course.split(' - ')[0]}</p>
                  <p className="muted">Specialization: {student.course.split(' - ')[1]}</p>
                </div>
              </div>
              <div className="info-grid">
                <Info label="Email Address" value={student.email} />
                <Info label="Student Number" value={student.studentNo} />
                <Info label="Phone" value={student.phone || '—'} />
                <Info label="Date of Birth" value={fmtDate(student.dob)} />
                <Info label="Units Loaded" value={`${unitsLoaded} of ${MAX_UNITS}`} />
                <Info label="Registered Subjects" value={approved.length} />
              </div>
            </div>
          </>
        );

      case 'subjects':
        return (
          <>
            <PageHeader title="Subject List" subtitle={`${unitsLoaded} of ${MAX_UNITS} units loaded`} />

            <h3 className="section-title">My Subjects</h3>
            {regs.length === 0 ? (
              <div className="table-container"><EmptyState text="You have no subjects yet. Register for a class below." /></div>
            ) : (
              <div className="subject-grid">
                {regs.map((r) => (
                  <div key={r.id} className="subject-card">
                    <div className="card-title-row">
                      <h4 style={{ color: 'var(--btn-primary-bg)' }}>{r.cls.subject.name}</h4>
                      <Badge status={r.status} />
                    </div>
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {r.cls.subject.code} - {r.cls.section} - {r.cls.day} {timeRange(r.cls)}
                    </p>
                    <div className="card-title-row muted" style={{ fontSize: '0.875rem' }}>
                      <span>{r.cls.teacher?.name}</span>
                      <span>{r.cls.subject.units} Units</span>
                    </div>
                    <button className="btn-danger btn-sm" style={{ marginTop: '1rem' }} onClick={() => setDropTarget(r)}>
                      {r.status === 'rejected' ? 'Remove' : 'Drop'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 className="section-title">Available Classes</h3>
            <div className="table-container">
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Subject</th><th>Section</th><th>Teacher</th><th>Schedule</th><th>Units</th><th>Action</th></tr></thead>
                  <tbody>
                    {available.map((c) => {
                      const reason = blockReason(c);
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.subject.code}</strong><br /><small className="muted">{c.subject.name}</small></td>
                          <td>{c.section}</td>
                          <td>{c.teacher?.name}</td>
                          <td>{c.day} {timeRange(c)}<br /><small className="muted">{c.room}</small></td>
                          <td>{c.subject.units}</td>
                          <td>
                            <button className="btn-primary btn-sm" disabled={!!reason} onClick={() => register(c)}>Register</button>
                            {reason && <small className="muted block">{reason}</small>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {available.length === 0 && <EmptyState text="No other classes are open right now." />}
              </div>
            </div>
          </>
        );

      case 'schedule': {
        const starts = [...new Set(active.map((r) => r.cls.start))].sort((a, b) => toMin(a) - toMin(b));
        return (
          <>
            <PageHeader title="Class Schedule" subtitle="Dashed blocks are waiting for approval.">
              <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            </PageHeader>

            {conflicts.length > 0 && (
              <div className="alert alert-danger" role="alert">
                <AlertTriangle size={18} />
                <div style={{ flex: 1 }}>
                  <strong>{conflicts.length} schedule conflict(s).</strong> Drop one subject in each pair to fix it.
                  {conflicts.map(([a, b]) => (
                    <div key={a.id + b.id} className="conflict-row">
                      <span>{a.cls.subject.code} and {b.cls.subject.code} overlap on {a.cls.day}.</span>
                      <span className="no-print">
                        <button className="btn-danger btn-sm" onClick={() => setDropTarget(a)}>Drop {a.cls.subject.code}</button>{' '}
                        <button className="btn-danger btn-sm" onClick={() => setDropTarget(b)}>Drop {b.cls.subject.code}</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-container" style={{ padding: '1.5rem' }}>
              {active.length === 0 ? (
                <EmptyState text="Your schedule is empty. Register for classes to see them here." />
              ) : (
                <div className="table-scroll">
                  <table className="schedule-table">
                    <thead><tr><th>Time</th>{DAYS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
                    <tbody>
                      {starts.map((s) => (
                        <tr key={s}>
                          <td><strong>{fmtTime(s)}</strong></td>
                          {DAYS.map((d) => {
                            const r = active.find((x) => x.cls.day === d && x.cls.start === s);
                            return (
                              <td key={d}>
                                {r && (
                                  <div className={`schedule-block ${r.status === 'pending' ? 'pending' : ''} ${conflictIds.has(r.id) ? 'conflict' : ''}`}>
                                    <strong>{r.cls.subject.code}</strong><br />
                                    {r.cls.subject.name}<br />
                                    <small>{timeRange(r.cls)} - {r.cls.room}</small>
                                  </div>
                                )}
                              </td>
                            );
                          })}
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
                  <thead><tr><th>Subject</th><th>Units</th><th>Midterm Grade</th><th>Finals Grade</th><th>Final Rating</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {rated.map(({ r, rating }) => {
                      const g = gradeOf(db.grades, student.id, r.cls.subjectId);
                      const show = (v) => (v === '' || v == null ? '—' : Number(v).toFixed(2));
                      const remark = remarkOf(rating);
                      return (
                        <tr key={r.id}>
                          <td>{r.cls.subject.name}<br /><small className="muted">{r.cls.subject.code}</small></td>
                          <td>{r.cls.subject.units}</td>
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
                {rated.length === 0 && <EmptyState text="No records yet. Grades appear here after your registrations are approved." />}
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
      brand="AttendX Student" userLabel={student.name} sections={[{ items: NAV.map((n) => (n.key === 'subjects' ? { ...n, count: pending.length } : n)) }]}
      active={page} onNav={setPage} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout}
    >
      {renderContent()}

      {dropTarget && (
        <ConfirmModal
          title={dropTarget.status === 'rejected' ? 'Remove Subject' : 'Drop Subject'}
          confirmLabel={dropTarget.status === 'rejected' ? 'Remove' : 'Drop'}
          message={<p>Do you want to {dropTarget.status === 'rejected' ? 'remove' : 'drop'} <strong>{dropTarget.cls.subject.code} - {dropTarget.cls.subject.name}</strong>? You can register again later.</p>}
          onConfirm={confirmDrop}
          onClose={() => setDropTarget(null)}
        />
      )}
      {profileModal === 'edit' && <EditProfileModal student={student} db={db} notify={notify} onClose={() => setProfileModal(null)} />}
      {profileModal === 'password' && <PasswordModal student={student} db={db} notify={notify} onClose={() => setProfileModal(null)} />}
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
        <p className="form-hint">Email, course and student number can only be changed by the admin.</p>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ student, db, notify, onClose }) {
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
