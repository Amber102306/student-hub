import { useEffect, useState } from 'react';
import { X, LogOut, Moon, Sun, ChevronDown, Plus } from 'lucide-react';
import { DAYS, dayShort, timeRange, sortMeetings } from './data';

export function Modal({ title, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div>{message}</div>
      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// Shows every time slot of a class, one per line: "Mon 01:00PM - 03:00PM - 409MB"
export function Meetings({ meetings, rooms = true }) {
  return (
    <div className="meeting-list">
      {sortMeetings(meetings).map((m, i) => (
        <div key={i}>
          <strong>{dayShort(m.day)}</strong> {timeRange(m)}
          {rooms && <span className="muted"> - {m.room}</span>}
        </div>
      ))}
    </div>
  );
}

// A class can meet many times a week. Each row is one time slot.
function MeetingsField({ field, value, onChange }) {
  const rows = value || [];
  const set = (next) => onChange({ target: { name: field.name, value: next } });
  const update = (i, key, v) => set(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  return (
    <div className="form-group">
      <label>{field.label}</label>
      {rows.map((m, i) => (
        <div className="meeting-row" key={i}>
          <select aria-label="Day" value={m.day} onChange={(e) => update(i, 'day', e.target.value)} required>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" aria-label="Start time" value={m.start} onChange={(e) => update(i, 'start', e.target.value)} required />
          <input type="time" aria-label="End time" value={m.end} onChange={(e) => update(i, 'end', e.target.value)} required />
          <input aria-label="Room" placeholder="409MB" value={m.room} onChange={(e) => update(i, 'room', e.target.value)} required />
          <button type="button" className="action-delete" aria-label="Remove time slot" disabled={rows.length === 1} onClick={() => set(rows.filter((_, j) => j !== i))}>
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button" className="btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => set([...rows, { day: 'Monday', start: '', end: '', room: rows[rows.length - 1]?.room || '' }])}
      >
        <Plus size={14} /> Add time slot
      </button>
      {field.hint && <small className="form-hint">{field.hint}</small>}
    </div>
  );
}

// field = { name, label, type, options, optional, placeholder, hint, min, max, step }
export function Field({ field, value, onChange }) {
  if (field.type === 'meetings') return <MeetingsField field={field} value={value} onChange={onChange} />;
  const id = `field-${field.name}`;
  const common = { id, name: field.name, value: value ?? '', onChange, required: !field.optional };
  return (
    <div className="form-group">
      <label htmlFor={id}>{field.label}{field.optional && ' (optional)'}</label>
      {field.type === 'select' ? (
        <select {...common}>
          <option value="" disabled>Select...</option>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          {...common}
          type={field.type || 'text'}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          autoComplete={field.autoComplete}
        />
      )}
      {field.hint && <small className="form-hint">{field.hint}</small>}
    </div>
  );
}

const TONE = { pending: 'yellow', enrolled: 'green', rejected: 'red', passed: 'green', failed: 'red' };

export function Badge({ status, children }) {
  const label = children ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`stat-badge badge-${TONE[status] || 'blue'}`}>{label}</span>;
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="empty-state">
      {title && <h3>{title}</h3>}
      <p>{text}</p>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-header page-header-row">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="no-print">{children}</div>}
    </header>
  );
}

// One layout for both portals: sidebar + main area.
// sections = [{ label?, items: [{ key, label, icon, count? }] }]
export function Shell({ brand, userLabel, sections, active, onNav, theme, toggleTheme, onLogout, children }) {
  const [closed, setClosed] = useState({});

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>{brand}</h2>
          <p className="sidebar-user">{userLabel}</p>
        </div>
        <nav className="sidebar-nav">
          {sections.map((s, i) => (
            <div key={i}>
              {s.label && (
                <button
                  type="button"
                  className="nav-group-header"
                  aria-expanded={!closed[s.label]}
                  onClick={() => setClosed((c) => ({ ...c, [s.label]: !c[s.label] }))}
                >
                  <span>{s.label}</span>
                  <ChevronDown size={16} style={{ transform: closed[s.label] ? 'rotate(-90deg)' : 'none' }} />
                </button>
              )}
              {!closed[s.label] &&
                s.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <a
                      key={it.key}
                      href="#"
                      className={`nav-item ${active === it.key ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); onNav(it.key); }}
                    >
                      <Icon size={18} /> {it.label}
                      {it.count > 0 && <span className="nav-count">{it.count}</span>}
                    </a>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <><Moon size={18} /> Dark Mode</> : <><Sun size={18} /> Light Mode</>}
          </button>
          <button className="logout-btn" onClick={onLogout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
