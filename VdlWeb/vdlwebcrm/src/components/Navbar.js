import React from 'react';
import '../styles/Navbar.css';
import { Link, useNavigate } from 'react-router-dom'; 
import { getCurrentUser } from '../utils/rbac';
import { authService } from '../features/auth/authService'; // Import authService

const Navbar = ({ title, toggleSidebar }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout(); // Use the centralized logout function
    navigate('/auth/login');
  };

  return (
    <header className="navbar">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <h1 className="page-title">{title}</h1>
      
      <div className="navbar-right">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Hello, {user.username}</span> {/* Changed to user.username */}
            <button onClick={handleLogout} className="btn-primary-action" style={{ background: '#e74c3c', width: 'auto', padding: '6px 12px', margin: 0 }}>Logout</button>
          </div>
        ) : (
          <div className="header-links">
            <Link to="/auth/login" className="header-link">Login</Link>
            <Link to="/auth/register" className="header-link">Register</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
