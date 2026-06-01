import React, { useState, useEffect } from 'react';
import { settings as dbSettings, saveSettingsToStorage, dummyUsers } from '../../utils/dummyDatabase';
import { getPermissions, savePermissions, ROLES, hasPermission } from '../../utils/rbac';
import '../../styles/Settings.css';

const FEATURES = [
  { key: 'enable_undo_redo', name: 'Enable Undo / Redo Option' },
  { key: 'settings_page', name: 'Settings Page Access' },
  { key: 'unlock_action', name: 'Unlock Row/Seat' },
  { key: 'bulk_assign', name: 'Bulk Assign Seats' },
  { key: 'add_new_row', name: 'Add New Layout Row' },
  { key: 'show_shift_dots', name: 'Show Shift Dots on Seats' }
];

const SYSTEM_STATUSES = [
  { Id: 1, StatusId: 1, StatusName: 'Pending', StatusType: 'Fee' },
  { Id: 2, StatusId: 2, StatusName: 'Partial', StatusType: 'Fee' },
  { Id: 3, StatusId: 3, StatusName: 'Paid', StatusType: 'Fee' },
  { Id: 4, StatusId: 4, StatusName: 'Active', StatusType: 'General' },
  { Id: 5, StatusId: 5, StatusName: 'Not Active', StatusType: 'General' },
  { Id: 6, StatusId: 6, StatusName: 'Active', StatusType: 'Student' },
  { Id: 7, StatusId: 7, StatusName: 'Not Active', StatusType: 'Student' },
  { Id: 8, StatusId: 8, StatusName: 'Dropped', StatusType: 'Student' },
  { Id: 9, StatusId: 9, StatusName: 'Cancelled', StatusType: 'Student' },
  { Id: 10, StatusId: 10, StatusName: 'Self', StatusType: 'Users' }
];

const getRoleId = (roleName) => {
  if (!roleName) return ROLES.STUDENT;
  const r = String(roleName).toLowerCase();
  if (r.includes('admin')) return ROLES.ADMIN;
  if (r.includes('internal')) return ROLES.INTERNAL;
  if (r.includes('external')) return ROLES.EXTERNAL;
  return ROLES.STUDENT;
};

const Settings = () => {
  const [settingsList, setSettingsList] = useState(dbSettings);
  const [rbacConfig, setRbacConfig] = useState(getPermissions());

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  
  // Edit Modal State
  const [editStatus, setEditStatus] = useState('on');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [selectedStatusType, setSelectedStatusType] = useState('All');

  const openEditModal = (feature) => {
    setSelectedFeature(feature);
    const setting = settingsList.find(s => s.id === feature.key);
    setEditStatus(setting ? setting.status : 'on');

    const perms = rbacConfig[feature.key] || { roles: [ROLES.ADMIN], specific_users: [] };

    let prefillUsers = [];
    if (perms.specific_users && perms.specific_users.length > 0) {
      prefillUsers = [...perms.specific_users];
    } else {
      dummyUsers.forEach(u => {
        if (perms.roles.includes(getRoleId(u.role))) {
          prefillUsers.push(String(u.id));
        }
      });
    }
    setSelectedUsers(prefillUsers);
    setSelectedRoleFilter('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (feature) => {
    setSelectedFeature(feature);
    setIsViewModalOpen(true);
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();

    // 1. Save Settings Status (ON/OFF)
    let updatedSettings = [...settingsList];
    const existingIdx = updatedSettings.findIndex(s => s.id === selectedFeature.key);
    if (existingIdx !== -1) {
      updatedSettings[existingIdx].status = editStatus;
    } else {
      updatedSettings.push({ id: selectedFeature.key, name: selectedFeature.name, status: editStatus });
    }
    setSettingsList(updatedSettings);
    saveSettingsToStorage(updatedSettings);

    // 2. Update RBAC User Permissions
    const uniqueRoles = new Set([ROLES.ADMIN]);
    selectedUsers.forEach(userId => {
      const u = dummyUsers.find(du => String(du.id) === userId);
      if (u) uniqueRoles.add(getRoleId(u.role));
    });

    const updatedRbac = {
      ...rbacConfig,
      [selectedFeature.key]: {
        roles: Array.from(uniqueRoles),
        specific_users: selectedUsers
      }
    };
    setRbacConfig(updatedRbac);
    savePermissions(updatedRbac);

    setIsEditModalOpen(false);
    alert('Settings Saved Successfully!');
    window.location.reload();
  };

  const filteredUsers = selectedRoleFilter
    ? dummyUsers.filter(u => String(u.role).toLowerCase() === selectedRoleFilter.toLowerCase())
    : dummyUsers;

  const getPermittedUsers = (featureKey) => {
    return dummyUsers.filter(u => {
      const userWithRole = { ...u, roleId: getRoleId(u.role) };
      return hasPermission(userWithRole, featureKey);
    });
  };
  
  const statusTypes = [...new Set(SYSTEM_STATUSES.map(s => s.StatusType))];
  const filteredStatuses = selectedStatusType === 'All' 
    ? SYSTEM_STATUSES 
    : SYSTEM_STATUSES.filter(s => s.StatusType === selectedStatusType);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>System Settings & Permissions</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Side: Feature Permissions */}
        <div className="table-responsive" style={{ flex: '2 1 500px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px' }}>Feature Permissions</h3>
          <table className="user-table">
            <thead>
              <tr>
                <th>Setting Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(feature => {
                const setting = settingsList.find(s => s.id === feature.key);
                const status = setting ? setting.status : 'on';
                return (
                  <tr key={feature.key}>
                    <td style={{ fontWeight: 'bold' }}>{feature.name}</td>
                    <td>
                      <span className={`status-badge ${status === 'on' ? 'fully-booked' : 'locked'}`}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary-action" style={{ background: '#3498db', padding: '6px 12px', width: 'auto' }} onClick={() => openViewModal(feature)}>View</button>
                        <button className="btn-primary-action" style={{ padding: '6px 12px', width: 'auto' }} onClick={() => openEditModal(feature)}>Change Setting</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Side: System Statuses Reference */}
        <div style={{ flex: '1 1 300px', maxWidth: '400px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px' }}>System Statuses Reference</h3>
          <div className="form-group full-width" style={{ marginBottom: '15px' }}>
            <label>Filter by Status Type:</label>
            <select 
              value={selectedStatusType} 
              onChange={(e) => setSelectedStatusType(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', outline: 'none' }}
            >
              <option value="All">All Statuses</option>
              {statusTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px' }}>
            <table className="user-table" style={{ margin: 0, fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Status Id</th>                  
                  <th> Status Type</th>
                  <th>Status Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredStatuses.map(status => (
                  <tr key={status.Id}>
                    <td style={{ fontWeight: 'bold' }}>{status.StatusId}</td>
                    <td className="text-muted">{status.StatusType}</td>
                      <td><span className="status-badge fully-booked" style={{ background: '#ecf0f1', color: '#333' }}>{status.StatusName}</span></td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Edit Setting: {selectedFeature?.name}</h3>
              <button className="btn-close-icon" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} className="edit-student-form">
                <div className="form-group full-width">
                  <label>Setting Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', outline: 'none' }}>
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Filter Users by Role</label>
                  <select value={selectedRoleFilter} onChange={(e) => setSelectedRoleFilter(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', outline: 'none' }}>
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Select Users for Permission</label>
                  <div className="users-checkbox-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', background: '#f9f9f9' }}>
                    {filteredUsers.map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(String(u.id))}
                          onChange={() => handleUserToggle(String(u.id))}
                          style={{ marginRight: '10px' }}
                        />
                        {u.username || u.name} <span style={{ color: '#7f8c8d', fontSize: '12px', marginLeft: '5px' }}>({u.role})</span>
                      </label>
                    ))}
                    {filteredUsers.length === 0 && <p style={{ color: '#7f8c8d', fontSize: '13px' }}>No users found for this role.</p>}
                  </div>
                </div>

                <div className="form-actions full-width" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn-primary-action">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedFeature && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{selectedFeature.name} - Permissions</h3>
              <button className="btn-close-icon" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <p style={{ marginBottom: '15px', color: '#555' }}>The following users have access to this setting:</p>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {getPermittedUsers(selectedFeature.key).map(u => (
                    <tr key={u.id}>
                      <td>{u.username || u.name}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                  {getPermittedUsers(selectedFeature.key).length === 0 && (
                    <tr><td colSpan="2" style={{ textAlign: 'center' }}>No users have permission.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;