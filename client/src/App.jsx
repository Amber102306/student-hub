import { useState, useEffect, useCallback } from 'react';
import { useDB, buildSession } from './store';
import { api, getToken, setToken, setAuthFailHandler } from './api';
import Login from './Login';
import AdminPortal from './AdminPortal';
import StudentPortal from './StudentPortal';

export default function App() {
  const [session, setSession] = useState(null); // { role, user, student?, id? }
  const [booting, setBooting] = useState(() => !!getToken());
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });
  const db = useDB(session);

  const notify = useCallback((message, type = 'success') => setToast({ message, type, key: Date.now() }), []);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  const logout = () => { setToken(null); setSession(null); };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // If the login token expires, go back to the login page.
  useEffect(() => {
    setAuthFailHandler(() => {
      setSession(null);
      notify('Your session ended. Please log in again.', 'error');
    });
  }, [notify]);

  // Keep the user logged in after a page refresh.
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me')
      .then((res) => setSession(buildSession(res)))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const student = session?.role === 'student' ? db.students.find((s) => s.id === session.id) : null;

  let screen;
  if (booting || (session && db.loading)) {
    screen = <div className="boot-screen">Loading...</div>;
  } else if (session && db.loadError) {
    screen = (
      <div className="boot-screen">
        <p>{db.loadError}</p>
        <div className="action-buttons" style={{ marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => db.reload().catch((e) => notify(e.message, 'error'))}>Try again</button>
          <button className="btn-cancel" onClick={logout}>Log out</button>
        </div>
      </div>
    );
  } else if (!session || (session.role === 'student' && !student)) {
    screen = <Login theme={theme} toggleTheme={toggleTheme} onLogin={setSession} notify={notify} />;
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
