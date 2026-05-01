import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Navbar.css';
import { Link, useNavigate } from 'react-router-dom'; 
import { getCurrentUser } from '../utils/rbac';
import { authService } from '../features/auth/authService'; // Import authService

const Navbar = ({ title, toggleSidebar }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  const handleLogout = useCallback(() => {
    authService.logout(); // Use the centralized logout function
    navigate('/auth/login');
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const getExpTime = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      if (!token) return 0;
      try {
        // Safely decode JWT payload to get 'exp'
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload).exp * 1000; // Convert to milliseconds
      } catch (e) {
        return 0;
      }
    };

    const updateTimer = () => {
      const expTime = getExpTime();
      if (!expTime) return;
      const left = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(left);

      if (left <= 0) {
        handleLogout();
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [user, handleLogout]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  return (
    <header className="navbar">
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <h1 className="page-title" style={{ color: "blue", fontSize: "20px", marginBottom:"0px" }}>Welcome to Vinayak Digital Library</h1>
      
      <div className="navbar-right">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold', color: timeLeft < 300 ? '#e74c3c' : '#f39c12', fontSize: '13px', background: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
              ⏳ Session ends in: {formatTime(timeLeft)}
            </span>
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
