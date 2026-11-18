import { useState } from 'react';
import { LayoutDashboard, User, Book, Calendar, FileText, LogOut, Moon, Sun} from 'lucide-react';

export default function StudentPortal({ theme, toggleTheme, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');

  // Mock data based on the provided StudentHub screenshots
  const profileData = { 
    name: 'Bryce Amber', 
    course: 'BSIT - Web Development', 
    email: 'student@email.com', 
    studentNo: '2026-00123' 
  };
  
  const subjects = [
    { code: 'IT 201', name: 'Web Application Development', prof: 'Prof. Smith', units: 3 },
    { code: 'IT 202', name: 'Information Assurance and Security', prof: 'Prof. Johnson', units: 3 },
    { code: 'IT 203', name: 'Database Management Systems', prof: 'Prof. Williams', units: 4 },
    { code: 'IT 204', name: 'Data Structures and Algorithms', prof: 'Prof. Brown', units: 3 }
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Good Morning, {profileData.name} 👋</h1>
              <p style={{ color: 'var(--text-muted)' }}>{profileData.course}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Registered Courses</p>
                <div className="stat-value">5 <span className="stat-badge badge-blue">+1 this week</span></div>
              </div>
              <div className="stat-card">
                <p className="stat-label">Weekly Classes</p>
                <div className="stat-value">18 <span className="stat-badge badge-green">This week</span></div>
              </div>
              <div className="stat-card">
                <p className="stat-label">Pending Registrations</p>
                <div className="stat-value">2 <span className="stat-badge badge-yellow">Action required</span></div>
              </div>
              <div className="stat-card">
                <p className="stat-label">Schedule Conflicts</p>
                <div className="stat-value">1 <span className="stat-badge badge-red">Resolve now</span></div>
              </div>
            </div>

            <div className="dashboard-columns">
              <div className="table-container" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-main)' }}>Upcoming Classes</h3>
                  <a href="#" style={{ color: 'var(--btn-primary-bg)', fontSize: '0.875rem', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActivePage('schedule'); }}>Full Schedule →</a>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>DAY</th>
                      <th>SUBJECT</th>
                      <th>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Mon</strong></td>
                      <td>Web Systems<br/><small style={{color: 'var(--text-muted)'}}>IT201</small></td>
                      <td>09:00 - 10:30</td>
                    </tr>
                    <tr>
                      <td><strong>Tue</strong></td>
                      <td>Database Management<br/><small style={{color: 'var(--text-muted)'}}>IT301</small></td>
                      <td>10:30 - 12:00</td>
                    </tr>
                    <tr>
                      <td><strong>Wed</strong></td>
                      <td>Information Assurance<br/><small style={{color: 'var(--text-muted)'}}>IT401</small></td>
                      <td>01:00 - 02:30</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="table-container" style={{ padding: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Semester Progress</h3>
                
                <div className="progress-group">
                  <div className="progress-label"><span>Semester Completion</span> <span>60%</span></div>
                  <div className="progress-bar"><div className="progress-fill fill-blue" style={{width: '60%'}}></div></div>
                </div>
                
                <div className="progress-group">
                  <div className="progress-label"><span>Credits Earned</span> <span>84/140</span></div>
                  <div className="progress-bar"><div className="progress-fill fill-navy" style={{width: '60%'}}></div></div>
                </div>
                
                <div className="progress-group">
                  <div className="progress-label"><span>Attendance</span> <span>87%</span></div>
                  <div className="progress-bar"><div className="progress-fill fill-green" style={{width: '87%'}}></div></div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current CGPA</p>
                  <h2 style={{ color: 'var(--text-main)', fontSize: '2rem' }}>1.45</h2>
                </div>
              </div>
            </div>
          </>
        );

      case 'profile':
        return (
          <div className="table-container" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '2rem', color: 'var(--text-main)' }}>Student Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="avatar-large">BA</div>
              <div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{profileData.name}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{profileData.course.split(' - ')[0]}</p>
                <p style={{ color: 'var(--text-muted)' }}>Specialization: {profileData.course.split(' - ')[1]}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email Address</p>
                <p style={{ fontWeight: '500' }}>{profileData.email}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Student Number</p>
                <p style={{ fontWeight: '500' }}>{profileData.studentNo}</p>
              </div>
            </div>
          </div>
        );

      case 'subjects':
        return (
          <>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Subject List</h2>
            <div className="subject-grid">
              {subjects.map((sub, idx) => (
                <div key={idx} className="subject-card">
                  <h4 style={{ color: 'var(--btn-primary-bg)', marginBottom: '0.25rem' }}>{sub.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{sub.code}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <span>{sub.prof}</span>
                    <span>{sub.units} Units</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'schedule':
        return (
          <div className="table-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Weekly Class Schedule</h2>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>08:00 AM</strong></td><td></td><td></td><td></td><td></td>
                  <td><div className="schedule-block"><strong>Data Struct</strong><br/>IT204</div></td>
                </tr>
                <tr>
                  <td><strong>09:00 AM</strong></td>
                  <td><div className="schedule-block"><strong>Web Dev</strong><br/>IT201</div></td>
                  <td></td><td></td><td></td><td></td>
                </tr>
                <tr>
                  <td><strong>10:30 AM</strong></td><td></td>
                  <td><div className="schedule-block"><strong>Database</strong><br/>IT301</div></td>
                  <td></td><td></td><td></td>
                </tr>
                <tr>
                  <td><strong>01:00 PM</strong></td><td></td><td></td>
                  <td><div className="schedule-block"><strong>InfoSec</strong><br/>IT401</div></td>
                  <td></td><td></td>
                </tr>
                <tr>
                  <td><strong>02:30 PM</strong></td><td></td><td></td><td></td>
                  <td><div className="schedule-block"><strong>Networking</strong><br/>IT302</div></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'records':
        return (
          <div className="table-container" style={{ padding: '1.5rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Academic Records</h2>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Midterm Grade</th>
                  <th>Finals Grade</th>
                  <th>Final Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Web Application Development</td><td>1.5</td><td>1.25</td><td><strong>1.25</strong></td>
                </tr>
                <tr>
                  <td>Information Assurance</td><td>1.75</td><td>1.5</td><td><strong>1.5</strong></td>
                </tr>
                <tr>
                  <td>Database Management</td><td>1.25</td><td>1.25</td><td><strong>1.25</strong></td>
                </tr>
                <tr>
                  <td>Data Structures</td><td>2</td><td>1.75</td><td><strong>1.75</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>AttendX Student</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}>
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="#" className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('profile'); }}>
            <User size={18} /> Student Profile
          </a>
          <a href="#" className={`nav-item ${activePage === 'subjects' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('subjects'); }}>
            <Book size={18} /> Subject List
          </a>
          <a href="#" className={`nav-item ${activePage === 'schedule' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('schedule'); }}>
            <Calendar size={18} /> Class Schedule
          </a>
          <a href="#" className={`nav-item ${activePage === 'records' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('records'); }}>
            <FileText size={18} /> Academic Records
          </a>
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <><Moon size={18} /> Dark Mode</> : <><Sun size={18} /> Light Mode</>}
          </button>
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* The top-nav has been completely removed to match the Admin format */}
            
        {/* renderContent already contains the specific headers for each page */}            {renderContent()}
      </main>
    </div>
  );
}