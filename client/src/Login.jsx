import { useState } from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { ADMIN, DEMO_STUDENT, COURSES } from './data';

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input-wrapper">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} className="password-field" autoComplete={autoComplete} required />
      <button type="button" className="eye-icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Login({ db, theme, toggleTheme, onLogin, notify }) {
  const [view, setView] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState(DEMO_STUDENT.email);
  const [password, setPassword] = useState(DEMO_STUDENT.password);
  const [error, setError] = useState('');
  const [signup, setSignup] = useState({ name: '', email: '', course: COURSES[0], password: '', confirm: '' });

  const demo = role === 'admin' ? ADMIN : DEMO_STUDENT;

  const switchRole = (next) => {
    const d = next === 'admin' ? ADMIN : DEMO_STUDENT;
    setRole(next);
    setEmail(d.email);
    setPassword(d.password);
    setError('');
  };

  const goTo = (next) => { setView(next); setError(''); };

  const handleLogin = (e) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (role === 'admin') {
      if (mail === ADMIN.email && password === ADMIN.password) return onLogin({ role: 'admin' });
    } else {
      const s = db.students.find((x) => x.email.toLowerCase() === mail && x.password === password);
      if (s) return onLogin({ role: 'student', id: s.id });
    }
    setError('Wrong email or password. Please try again.');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const mail = signup.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError('Enter a valid email address.');
    if (db.students.some((s) => s.email.toLowerCase() === mail)) return setError('That email already has an account.');
    if (signup.password.length < 8) return setError('Password must have at least 8 characters.');
    if (signup.password !== signup.confirm) return setError('Passwords do not match.');
    db.addStudent({ name: signup.name.trim(), email: mail, phone: '', dob: '', course: signup.course, password: signup.password });
    notify('Account created. You can log in now.');
    setRole('student');
    setEmail(mail);
    setPassword('');
    goTo('login');
  };

  const setS = (e) => setSignup({ ...signup, [e.target.name]: e.target.value });

  return (
    <div className="login-container">
      <button className="login-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="login-box">
        {view === 'login' ? (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {role === 'admin' ? 'Admin Login' : 'Welcome Back'}
            </h2>
            <p className="login-subtitle">Please enter your email and password to sign in.</p>

            <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="form-group">
                <label htmlFor="login-email">School Email</label>
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <PasswordInput id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <button type="submit" className="login-submit-btn">Log In</button>
            </form>

            <p className="login-demo">Demo account: {demo.email} / {demo.password}</p>

            <div className="login-footer">
              {role === 'student' && (
                <p className="login-footer-text">
                  Don't have an account? <span className="login-link" role="button" tabIndex={0} onClick={() => goTo('signup')} onKeyDown={(e) => e.key === 'Enter' && goTo('signup')}>Sign Up here</span>
                </p>
              )}
              <p className="login-footer-text" style={{ marginTop: '0.5rem' }}>
                {role === 'student' ? 'Are you an Administrator? ' : 'Are you a student? '}
                <span className="login-link" role="button" tabIndex={0} onClick={() => switchRole(role === 'student' ? 'admin' : 'student')} onKeyDown={(e) => e.key === 'Enter' && switchRole(role === 'student' ? 'admin' : 'student')}>
                  {role === 'student' ? 'Login as Admin here' : 'Login as Student here'}
                </span>
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create Account</h2>
            <p className="login-subtitle">Sign up as a student to register for classes.</p>

            <form onSubmit={handleSignup} style={{ marginTop: '2rem' }}>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="form-group">
                <label htmlFor="su-name">Full Name</label>
                <input id="su-name" name="name" value={signup.name} onChange={setS} required />
              </div>
              <div className="form-group">
                <label htmlFor="su-email">School Email</label>
                <input id="su-email" name="email" type="email" value={signup.email} onChange={setS} required />
              </div>
              <div className="form-group">
                <label htmlFor="su-course">Course</label>
                <select id="su-course" name="course" value={signup.course} onChange={setS} required>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="su-password">Password</label>
                <PasswordInput id="su-password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} autoComplete="new-password" />
                <small className="form-hint">At least 8 characters.</small>
              </div>
              <div className="form-group">
                <label htmlFor="su-confirm">Confirm Password</label>
                <PasswordInput id="su-confirm" value={signup.confirm} onChange={(e) => setSignup({ ...signup, confirm: e.target.value })} autoComplete="new-password" />
              </div>
              <button type="submit" className="login-submit-btn">Create Account</button>
            </form>

            <div className="login-footer" style={{ marginTop: '1.5rem' }}>
              <p className="login-footer-text">
                Already have an account? <span className="login-link" role="button" tabIndex={0} onClick={() => goTo('login')} onKeyDown={(e) => e.key === 'Enter' && goTo('login')}>Log in here</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}