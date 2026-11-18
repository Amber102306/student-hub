import { useState, useEffect, useCallback } from 'react';
import { useDB } from './store';
import Login from './Login';
import AdminPortal from './AdminPortal';
import StudentPortal from './StudentPortal';

export default function App() {
  const db = useDB();
  const [session, setSession] = useState(null); // { role: 'admin' } or { role: 'student', id }
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((message, type = 'success') => setToast({ message, type, key: Date.now() }), []);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const logout = () => setSession(null);

  const student = session?.role === 'student' ? db.students.find((s) => s.id === session.id) : null;

  let screen;
  if (!session || (session.role === 'student' && !student)) {
    screen = <Login db={db} theme={theme} toggleTheme={toggleTheme} onLogin={setSession} notify={notify} />;
  } else if (session.role === 'admin') {
    screen = <AdminPortal db={db} theme={theme} toggleTheme={toggleTheme} onLogout={logout} notify={notify} />;
  } else {
    screen = <StudentPortal student={student} db={db} theme={theme} toggleTheme={toggleTheme} onLogout={logout} notify={notify} />;
  }

  return (
    <>
      {screen}
      {toast && <div key={toast.key} className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </>
  );
}