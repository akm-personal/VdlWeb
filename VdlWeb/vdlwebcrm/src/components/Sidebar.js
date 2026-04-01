import React, { useState, useEffect } from 'react';
import { Link  } from 'react-router-dom';
import '../styles/Sidebar.css';
import { getCurrentUser, canAccessPage, ROLES, isStudentProfileComplete as checkStudentProfileComplete } from '../utils/rbac';

const Sidebar = ({ collapsed }) => {
  const user = getCurrentUser() || { roleId: 1 }; // Default to Admin if not logged in
  const isStudent = user.roleId === ROLES.STUDENT;
  const isAdminOrInternal = user.roleId === ROLES.ADMIN || user.roleId === ROLES.INTERNAL;

  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (isStudent && user?.id) {
      setIsProfileComplete(checkStudentProfileComplete(user.id));
    } else {
      setIsProfileComplete(false); // Reset for non-students
    }

    // Listen for storage changes to update profile status dynamically
    const handleStorageChange = (event) => {
      if (event.key && event.key.startsWith('vdl_profile_') || event.type === 'profileUpdated') {
        setIsProfileComplete(checkStudentProfileComplete(user.id));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange); 

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, [isStudent, user?.id]);
  
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        {canAccessPage(user, 'dashboard') && (
          <Link to="/" className="nav-link">
            <span className="icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>
        )}
        {canAccessPage(user, 'users') && (
          <Link to="/users" className="nav-link">
            <span className="icon">👥</span>
            <span className="nav-text">Users</span>
          </Link>
        )}
        {canAccessPage(user, 'studentDetails') && (
          <Link to="/studentDetails" className="nav-link">
            <span className="icon">🎓</span>
            <span className="nav-text">Student Details</span>
          </Link>
        )}
        {canAccessPage(user, 'seats') && (
          <Link to="/seats" className="nav-link">
            <span className="icon">🪑</span>
            <span className="nav-text">Seat Layout</span>
          </Link>
        )}
        {canAccessPage(user, 'shiftManagement') && (
          <Link to="/shift-management" className="nav-link">
            <span className="icon">⏰</span>
            <span className="nav-text">Shift Management</span>
          </Link>
        )}

        {isAdminOrInternal && (
          <Link to="/identityCards" className="nav-link">
            <span className="icon">💳</span>
            <span className="nav-text">Identity Cards</span>
          </Link>
        )}
        {isStudent && !isProfileComplete && (
          <Link to="/studentDetails" className="nav-link">
            <span className="icon">📝</span> {/* New icon for "Complete Profile" */}
            <span className="nav-text">Complete Profile</span>
          </Link>
        )}       
      {canAccessPage(user, 'settings') && (
        <Link to="/settings" className="nav-link">
          <span className="icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </Link>
      )}
      </nav>
    </aside>
  );
};

export default Sidebar;