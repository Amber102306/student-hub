import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, LayoutDashboard, Users, BookOpen, LogOut, ChevronDown, X, Moon, Sun, Book, Eye, EyeOff } from 'lucide-react';
import StudentPortal from './StudentPortal';
import './index.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [theme, setTheme] = useState('light');
  const [activePage, setActivePage] = useState('students'); 
  
  // New Login States
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('student'); // Toggles the login screen mode
  
  const [students, setStudents] = useState([
    { id: 1, name: 'Aaron', roll: '0', phone: '+917979766495', dob: '05-05-1999' },
    { id: 2, name: 'Ajeet', roll: '15', phone: '+911234567902', dob: '09-11-2021' }
  ]);
  
  const [modal, setModal] = useState({ isOpen: false, type: '', data: null });
  const [formData, setFormData] = useState({ name: '', roll: '', phone: '', dob: '' });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setUserRole(loginMode);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  const openModal = (type, data = null) => {
    setModal({ isOpen: true, type, data });
    if (data && type === 'edit') {
      setFormData(data);
    } else {
      setFormData({ name: '', roll: '', phone: '', dob: '' });
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', data: null });

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modal.type === 'add') {
      setStudents([...students, { ...formData, id: Date.now() }]);
    } else if (modal.type === 'edit') {
      setStudents(students.map(s => s.id === modal.data.id ? { ...formData, id: s.id } : s));
    }
    closeModal();
  };

  const handleDelete = () => {
    setStudents(students.filter(s => s.id !== modal.data.id));
    closeModal();
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Welcome Back</h2>
          <p className="login-subtitle">Please enter your email to sign in.</p>
          
          <form onSubmit={handleLogin} style={{ marginTop: '2rem' }}>
            <div className="form-group">
              <label>School Email</label>
              <input 
                type="email" 
                defaultValue={loginMode === 'student' ? 'udaundobb@students.national-u.edu.ph' : 'admin@national-u.edu.ph'} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  defaultValue="........." 
                  className="password-field"
                  required 
                />
                <button 
                  type="button" 
                  className="eye-icon-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="login-submit-btn">
              Log In
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account? <span className="login-link">Sign Up here</span>
            </p>
            
            {loginMode === 'student' ? (
              <p className="login-footer-text" style={{ marginTop: '0.5rem' }}>
                Are you an Administrator? <span className="login-link" onClick={() => setLoginMode('admin')}>Login as Admin here</span>
              </p>
            ) : (
              <p className="login-footer-text" style={{ marginTop: '0.5rem' }}>
                Are you a student? <span className="login-link" onClick={() => setLoginMode('student')}>Login as Student here</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'student') {
    return <StudentPortal theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <div className="table-container" style={{ padding: '2rem' }}>Welcome to the Admin Dashboard overview.</div>;
      case 'classes': return <div className="table-container" style={{ padding: '2rem' }}>Manage institution classes and sections here.</div>;
      case 'teachers': return <div className="table-container" style={{ padding: '2rem' }}>Manage faculty and teacher assignments here.</div>;
      case 'subjects': return <div className="table-container" style={{ padding: '2rem' }}>Manage course subjects and curriculums here.</div>;
      case 'students':
        return (
          <>
            <div className="toolbar">
              <div className="search-bar">
                <input type="text" placeholder="Search students..." />
                <button className="btn-icon"><Search size={18} /></button>
              </div>
              <div className="action-buttons">
                <button className="btn-primary" onClick={() => openModal('add')}><Plus size={18} /> Add New</button>
                <button className="btn-secondary" onClick={() => openModal('multiple')}><Plus size={18} /> Add Multiple</button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Sl no</th><th>Name</th><th>Roll</th><th>Phone</th><th>Date of Birth</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td><td>{student.name}</td><td>{student.roll}</td><td>{student.phone}</td><td>{student.dob}</td>
                      <td className="actions-cell">
                        <button className="action-edit" onClick={() => openModal('edit', student)}><Edit2 size={16} /></button>
                        <button className="action-delete" onClick={() => openModal('delete', student)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      default: return <div>Page not found</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header"><h2>AttendX Admin</h2></div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}><LayoutDashboard size={18} /> Dashboard</a>
          <div className="nav-group">
            <div className="nav-group-header"><span>Academics</span><ChevronDown size={16} /></div>
            <a href="#" className={`nav-item ${activePage === 'classes' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('classes'); }}><BookOpen size={18} /> Classes</a>
            <a href="#" className={`nav-item ${activePage === 'teachers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('teachers'); }}><Users size={18} /> Teachers</a>
            <a href="#" className={`nav-item ${activePage === 'students' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('students'); }}><Users size={18} /> Students</a>
            <a href="#" className={`nav-item ${activePage === 'subjects' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('subjects'); }}><Book size={18} /> Subjects</a>
          </div>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>{theme === 'light' ? <><Moon size={18} /> Dark Mode</> : <><Sun size={18} /> Light Mode</>}</button>
          <button className="logout-btn" onClick={handleLogout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header"><h1 style={{ textTransform: 'capitalize' }}>{activePage}</h1></header>
        {renderContent()}

        {modal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{modal.type === 'add' && 'Add New Student'}{modal.type === 'edit' && 'Edit Student'}{modal.type === 'multiple' && 'Add Multiple Students'}{modal.type === 'delete' && 'Confirm Delete'}</h2>
                <button className="close-btn" onClick={closeModal}><X size={20} /></button>
              </div>
              
              <div className="modal-body">
                {(modal.type === 'add' || modal.type === 'edit') && (
                  <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Name</label><input type="text" name="name" value={formData.name} onChange={handleFormChange} required /></div>
                    <div className="form-group"><label>Roll Number</label><input type="text" name="roll" value={formData.roll} onChange={handleFormChange} required /></div>
                    <div className="form-group"><label>Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleFormChange} required /></div>
                    <div className="form-group"><label>Date of Birth</label><input type="text" name="dob" placeholder="DD-MM-YYYY" value={formData.dob} onChange={handleFormChange} required /></div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Student</button>
                    </div>
                  </form>
                )}

                {modal.type === 'multiple' && (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>Upload a CSV file or paste bulk student data here.</p>
                    <textarea className="bulk-textarea" rows="6" placeholder="Name, Roll, Phone, DOB..."></textarea>
                    <div className="modal-actions"><button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button><button type="button" className="btn-primary" onClick={closeModal}>Import Data</button></div>
                  </div>
                )}

                {modal.type === 'delete' && (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>Are you sure you want to delete <strong>{modal.data?.name}</strong>? This action cannot be undone.</p>
                    <div className="modal-actions"><button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button><button type="button" className="btn-danger" onClick={handleDelete}>Delete</button></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}