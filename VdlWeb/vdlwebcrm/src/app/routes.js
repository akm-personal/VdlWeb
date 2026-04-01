import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import Dashboard from '../features/dashboard/Dashboard';
import UserList from '../features/users/UserList';
import ShiftManagement from '../features/shift/ShiftManagement';
import Settings from '../features/seats/Settings';

const routes = (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/auth" element={<Navigate to="/auth/register" replace />} />
    <Route path="/auth/login" element={<Login />} />
    <Route path="/auth/register" element={<Register />} />
    <Route path="/users" element={<UserList />} />
    <Route path="/shift-management" element={<ShiftManagement />} />
    <Route path="/seats" element={<Settings />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<Navigate to="/auth/register" replace />} />
  </Routes>
);

export default routes;
