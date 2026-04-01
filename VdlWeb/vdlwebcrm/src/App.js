import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './app/Layout';
import Dashboard from './features/dashboard/Dashboard';
import Users from './features/users/Users';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import StudentDetails from './features/student/studentDetails';
import AllStudent from './features/student/AllStudent';
import SeatManagement from './features/seats/SeatManagement';
import ShiftManagement from './features/shift/ShiftManagement';
import IdentityCard from './features/student/identityCard'; // Import the IdentityCard component
import Settings from './features/seats/Settings';
import { getCurrentUser } from './utils/rbac';
import LogsViewer from './components/LogsViewer'; // Import LogsViewer
import './App.css';

const ProtectedRoute = ({ children }) => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/logs" element={<LogsViewer />} /> {/* Moved outside ProtectedRoute */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="studentDetails" element={<StudentDetails />} />
          <Route path="allstudent" element={<AllStudent />} />
          <Route path="seats" element={<SeatManagement />} />
          <Route path="shift-management" element={<ShiftManagement />} />
          <Route path="identityCards" element={<IdentityCard />} /> {/* For Admin/Internal */}
          <Route path="student/identityCards" element={<IdentityCard />} /> {/* For Students */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
