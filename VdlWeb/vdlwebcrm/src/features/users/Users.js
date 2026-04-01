import React, { useState } from 'react';
import { dummyUsers } from '../../utils/dummyDatabase';
import '../../styles/Users.css';

const Users = () => {
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'table'
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '4' // default to student
  });

  const [users] = useState(dummyUsers);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPwdOpen, setIsPwdOpen] = useState(false);
  const [pwdData, setPwdData] = useState({ newPassword: '', confirmPassword: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editUserData, setEditUserData] = useState({ role: '', status: '' });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    console.log("Add User Data API Ready: ", formData);
    showToast('User ready to be added! (API pending)', 'success');
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setEditUserData({ role: user.role, status: user.status });
    setIsDetailsOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateDetails = (e) => {
    e.preventDefault();
    console.log("Update Details API Ready for User ID:", selectedUser.id, editUserData);
    showToast('User details updated successfully!', 'success');
    setIsDetailsOpen(false);
  };

  const handlePwdChange = (e) => {
    setPwdData({ ...pwdData, [e.target.name]: e.target.value });
  };

  const handlePwdSubmit = (e) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    console.log("Password Update API Ready for User ID:", selectedUser.id, pwdData);
    showToast('Password updated successfully!', 'success');
    setIsPwdOpen(false);
    setPwdData({ newPassword: '', confirmPassword: '' });
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000); // auto close after 3 seconds
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>Users Management</h2>
        <button 
          className="btn-toggle-view" 
          onClick={() => setViewMode(viewMode === 'form' ? 'table' : 'form')}
        >
          {viewMode === 'form' ? 'Show All Users' : 'Add New User'}
        </button>
      </div>

      {viewMode === 'form' ? (
        <div className="user-form-container">
          <form onSubmit={handleAddUser} className="user-form">
            <div className="form-group">
              <label>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleFormChange} required placeholder="Enter username" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="Enter email address" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleFormChange} required placeholder="Enter password" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="roleId" value={formData.roleId} onChange={handleFormChange}>
                <option value="1">Admin</option>
                <option value="2">internal</option>
                <option value="3">external</option>
                <option value="4">student</option>
              </select>
            </div>
            <div className="form-actions full-width">
              <button type="submit" className="btn-submit">Add User</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-list-container">
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>VDL ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.vdlId}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <button className="btn-view" onClick={() => openDetails(user)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isDetailsOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Details: {selectedUser.username}</h3>
              <button className="btn-close-icon" onClick={() => setIsDetailsOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateDetails}>
                <div className="details-grid">
                  <p><strong>ID:</strong> {selectedUser.id}</p>
                  <p><strong>VDL ID:</strong> {selectedUser.vdlId}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <div className="form-group">
                    <label><strong>Role</strong></label>
                    <select name="role" value={editUserData.role} onChange={handleEditChange}>
                      <option value="Admin">Admin</option>
                      <option value="internal">internal</option>
                      <option value="external">external</option>
                      <option value="student">student</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label><strong>Status</strong></label>
                    <select name="status" value={editUserData.status} onChange={handleEditChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions full-width" style={{ marginTop: '20px', gap: '15px' }}>
                  <button type="button" className="btn-update-pwd" onClick={() => setIsPwdOpen(true)}>Update Password</button>
                  <button type="submit" className="btn-submit">Update Details</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {isPwdOpen && (
        <div className="modal-overlay pwd-modal-overlay">
          <div className="modal-content pwd-modal-content">
            <div className="modal-header">
              <h3>Update Password</h3>
              <button className="btn-close-icon" onClick={() => setIsPwdOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePwdSubmit} className="user-form">
                <div className="form-group full-width">
                  <label>New Password</label>
                  <input type="password" name="newPassword" value={pwdData.newPassword} onChange={handlePwdChange} required placeholder="Enter new password" />
                </div>
                <div className="form-group full-width">
                  <label>Confirm Password</label>
                  <input type="password" name="confirmPassword" value={pwdData.confirmPassword} onChange={handlePwdChange} required placeholder="Confirm new password" />
                </div>
                <div className="form-actions full-width">
                  <button type="submit" className="btn-submit">Submit Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-container slide-in ${toast.type}`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default Users;