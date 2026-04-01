import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/Layout.css';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/users':
        return 'Users';
      case '/studentDetails':
        return 'Student Details';
      case '/allstudent':
        return 'All Students';
      case '/seats':
        return 'Seat Management';
      case '/shift-management':
        return 'Shift Management';
      case '/settings':
        return 'Settings';
      default:
        return 'Admin Panel';
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="layout">
      <Sidebar collapsed={sidebarCollapsed} />
      
      {/* Mobile Overlay to close sidebar by clicking outside */}
      {!sidebarCollapsed && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setSidebarCollapsed(true)}
        ></div>
      )}

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Navbar title={getTitle()} toggleSidebar={toggleSidebar} />
        <main className="content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;