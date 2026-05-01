import React, { useEffect, useState } from 'react';
import '../../styles/ShiftManagement.css';
import { formatTime12Hour } from '../../utils/helpers';
import { shiftService } from './shiftService';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingShift, setViewingShift] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    start: '08:00',
    end: '13:00',
    duration: 1,
    status: 'active'
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [editFormData, setEditFormData] = useState({
    shiftName: '',
    status: 1,
    startTime: '',
    endTime: ''
  });

  const computeEndTime = (start, duration) => {
    const [hourStr, minuteStr] = start.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const endHour = (hour + Number(duration)) % 24;
    const endHourStr = endHour < 10 ? `0${endHour}` : `${endHour}`;
    const endMinuteStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${endHourStr}:${endMinuteStr}`;
  };

  const computeDurationFromTimes = (start, end) => {
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    const duration = (endHour - startHour + 24) % 24;
    return duration === 0 ? 24 : duration;
  };

  const openModal = (shift = null) => {
    setError('');
    if (shift) {
      setFormData({
        ...shift,
        duration: computeDurationFromTimes(shift.start, shift.end)
      });
    } else {
      setFormData({ id: '', name: '', start: '08:00', end: '13:00', duration: 1, status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleViewShift = (shift) => {
    setError('');
    setIsEditMode(false);
    setViewingShift(shift);
  };

  const openEditMode = (shift) => {
    setError('');
    setEditFormData({
      shiftName: shift.name,
      status: shift.status === 'active' ? 1 : 0,
      startTime: shift.start,
      endTime: shift.end
    });
    setIsEditMode(true);
  };

  const closeEditMode = () => {
    setIsEditMode(false);
    setEditFormData({
      shiftName: '',
      status: 1,
      startTime: '',
      endTime: ''
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    setError('');
    
    // Validation
    if (editFormData.startTime === editFormData.endTime) {
      setError('Start time and End time cannot be exactly the same.');
      return;
    }

    const isDuplicate = shifts.find(s => s.name.toLowerCase() === editFormData.shiftName.toLowerCase() && s.id !== viewingShift.id);
    if (isDuplicate) {
      setError('Shift name must be unique.');
      return;
    }

    // Function to handle intervals, especially overnight shifts crossing midnight (e.g., 22:00 to 06:00)
    const getIntervals = (start, end) => {
      if (start < end) return [[start, end]];
      return [[start, '24:00'], ['00:00', end]];
    };

    const newIntervals = getIntervals(editFormData.startTime, editFormData.endTime);

    const hasOverlap = shifts.find(s => {
      if (s.id === viewingShift.id) return false;
      
      const existingIntervals = getIntervals(s.start, s.end);
      for (let [aStart, aEnd] of newIntervals) {
        for (let [bStart, bEnd] of existingIntervals) {
          // Overlap condition for any two intervals
          if (aStart < bEnd && bStart < aEnd) return true;
        }
      }
      return false;
    });
    
    if (hasOverlap) {
      setError(`Shift timing overlaps with existing shift: ${hasOverlap.name}`);
      return;
    }

    try {
      await shiftService.updateShift(viewingShift.id, {
        name: editFormData.shiftName,
        start: editFormData.startTime,
        end: editFormData.endTime,
        status: Number(editFormData.status) === 1 ? 1 : 0
      });
      setSuccessMessage(`✓ Shift "${editFormData.shiftName}" updated successfully!`);
      await fetchShifts();
      closeEditMode();
    } catch (error) {
      setError(error.message || 'Unable to update shift.');
    }
  };

  const parseTimeInput = (time24) => {
    if (!time24) return { h: '08', m: '00', a: 'AM' };
    let [H, M] = time24.split(':');
    H = parseInt(H, 10);
    const a = H >= 12 ? 'PM' : 'AM';
    let h = H % 12 || 12;
    h = h < 10 ? `0${h}` : String(h);
    return { h, m: M, a };
  };

  const handleTimeChange = (name, field, val, currentTime) => {
    let { h, m, a } = parseTimeInput(currentTime);
    if (field === 'h') h = val;
    if (field === 'm') m = val;
    if (field === 'a') a = val;

    let H = parseInt(h, 10);
    if (a === 'PM' && H !== 12) H += 12;
    if (a === 'AM' && H === 12) H = 0;
    let HStr = H < 10 ? `0${H}` : String(H);
    setFormData(prev => ({ ...prev, [name]: `${HStr}:${m}` }));
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Not Active';
    return status.toLowerCase() === 'active' ? 'Active' : 'Not Active';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchShifts = async () => {
    setError('');
    try {
      const data = await shiftService.getAll();
      setShifts(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
    } catch (error) {
      setError(error.message || 'Unable to load shifts.');
    }
  };

  useEffect(() => {
    fetchShifts();
    // Get user role from localStorage
    const storedUser = localStorage.getItem('user_info') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(Number(user.roleId || user.role || null));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.start === formData.end) {
      setError('Start time and End time cannot be exactly the same.');
      return;
    }

    const isDuplicate = shifts.find(s => s.name.toLowerCase() === formData.name.toLowerCase() && s.id !== formData.id);
    if (isDuplicate) {
      setError('Shift name must be unique.');
      return;
    }

    // Function to handle intervals, especially overnight shifts crossing midnight (e.g., 22:00 to 06:00)
    const getIntervals = (start, end) => {
      if (start < end) return [[start, end]];
      return [[start, '24:00'], ['00:00', end]];
    };

    const endTime = formData.id ? formData.end : computeEndTime(formData.start, formData.duration);

    if (!formData.id) {
      const duplicateTime = shifts.find(s => s.start === formData.start && s.end === endTime);
      if (duplicateTime) {
        setError(`Shift timing overlaps with existing shift: ${duplicateTime.name}`);
        return;
      }
    }

    const apiPayload = {
      name: formData.name,
      start: formData.start,
      end: endTime,
      status: formData.status === 'active' ? 1 : 0
    };

    try {
      if (formData.id) {
        await shiftService.updateShift(formData.id, apiPayload);
        setSuccessMessage(`✓ Shift "${formData.name}" updated successfully!`);
      } else {
        await shiftService.createShift(apiPayload);
        setSuccessMessage(`✓ Shift "${formData.name}" created successfully!`);
      }
      await fetchShifts();
      setIsModalOpen(false);
    } catch (error) {
      setError(error.message || 'Unable to save shift.');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await shiftService.deleteShift(id);
      setSuccessMessage('✓ Shift deleted successfully!');
      await fetchShifts();
      setDeleteConfirmId(null);
      setViewingShift(null);
    } catch (error) {
      setError(error.message || 'Unable to delete shift.');
    }
  };

  return (
    <div className="shift-page">
      {successMessage && (
        <div className="notification-toast success-notification">
          <span>{successMessage}</span>
          <button 
            className="notification-close-btn" 
            onClick={() => setSuccessMessage('')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              fontSize: '18px', 
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            ×
          </button>
        </div>
      )}
      <div className="shift-header">
        <h2>Library Shift Management</h2>
        <button className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => openModal()}>+ Create Shift</button>
      </div>

      <div className="table-responsive" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <table className="user-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Shift Name</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, index) => (
              <tr key={shift.id}>
                <td>{index + 1}</td>
                <td style={{ fontWeight: 'bold' }}>{shift.name}</td>
                <td>{formatTime12Hour(shift.start)}</td>
                <td>{formatTime12Hour(shift.end)}</td>
                <td>
                  {shift.isDeleted === 1 || shift.isDeleted === true ? (
                    <span className="status-badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Deleted</span>
                  ) : (
                    <span className={`status-badge ${shift.status === 'active' ? 'fully-booked' : 'locked'}`}>
                      {shift.status === 'active' ? 'Active' : 'Not Active'}
                    </span>
                  )}
                </td>
                <td>
                  <button className="btn-primary-action" style={{ backgroundColor: '#3498db', padding: '6px 12px', width: 'auto', marginRight: '5px' }} onClick={() => handleViewShift(shift)}>View</button>
                  {/* {(userRole === 1 || userRole === 2) && (
                    <button className="btn-primary-action" style={{ backgroundColor: '#f39c12', padding: '6px 12px', width: 'auto' }} onClick={() => openModal(shift)}>Edit</button>
                  )} */}
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No shifts available. Create one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingShift && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{isEditMode ? 'Edit Shift' : 'Shift Details'}</h3>
              <button className="btn-close-icon" onClick={() => { setViewingShift(null); closeEditMode(); }}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <p style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>{error}</p>}
              
              {isEditMode ? (
                // Edit Mode
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '8px', fontWeight: 'bold' }}>Shift Name</label>
                    <input 
                      type="text" 
                      name="shiftName" 
                      value={editFormData.shiftName} 
                      onChange={handleEditInputChange} 
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                      placeholder="e.g. Morning Shift" 
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '8px', fontWeight: 'bold' }}>Status</label>
                    <select 
                      name="status" 
                      value={editFormData.status} 
                      onChange={handleEditInputChange}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Not Active</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '8px', fontWeight: 'bold' }}>Start Time</label>
                    <input 
                      type="time" 
                      name="startTime" 
                      value={editFormData.startTime} 
                      onChange={handleEditInputChange} 
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '8px', fontWeight: 'bold' }}>End Time</label>
                    <input 
                      type="time" 
                      name="endTime" 
                      value={editFormData.endTime} 
                      onChange={handleEditInputChange} 
                      style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                    <button 
                      className="btn-danger" 
                      style={{ padding: '10px 20px', width: 'auto' }} 
                      onClick={() => { setDeleteConfirmId(viewingShift.id); closeEditMode(); }}
                    >
                      Delete
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-primary-action" 
                        style={{ backgroundColor: '#95a5a6', padding: '10px 20px', width: 'auto' }} 
                        onClick={closeEditMode}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary-action" 
                        style={{ padding: '10px 20px', width: 'auto' }} 
                        onClick={handleEditSave}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Shift Name</label>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>{viewingShift.name}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>
                        {viewingShift.isDeleted === 1 || viewingShift.isDeleted === true ? (
                          <span className="status-badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Deleted</span>
                        ) : (
                          <span className={`status-badge ${viewingShift.status === 'active' ? 'fully-booked' : 'locked'}`}>{getStatusLabel(viewingShift.status)}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Start Time</label>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>{formatTime12Hour(viewingShift.start)}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>End Time</label>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 15px 0' }}>{formatTime12Hour(viewingShift.end)}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Created Date</label>
                      <p style={{ fontSize: '14px', color: '#555', margin: '0 0 15px 0' }}>{viewingShift.createdDate ? new Date(viewingShift.createdDate).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Created By</label>
                      <p style={{ fontSize: '14px', color: '#555', margin: '0 0 15px 0' }}>{viewingShift.createdBy != null ? viewingShift.createdBy : 'N/A'}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Updated Date</label>
                      <p style={{ fontSize: '14px', color: '#555', margin: '0 0 15px 0' }}>{viewingShift.updatedDate ? new Date(viewingShift.updatedDate).toLocaleString() : 'Not updated'}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>Updated By</label>
                      <p style={{ fontSize: '14px', color: '#555', margin: '0 0 15px 0' }}>{viewingShift.updatedBy != null ? viewingShift.updatedBy : 'Not updated'}</p>
                    </div>
                  </div>
                  
                  {/* Show Edit button only for role 1 and 2 */}
                  {(userRole === 1 || userRole === 2) && !(viewingShift.isDeleted === 1 || viewingShift.isDeleted === true) && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button className="btn-primary-action" style={{ backgroundColor: '#f39c12', padding: '8px 16px', width: 'auto' }} onClick={() => openEditMode(viewingShift)}>Edit</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{formData.id ? 'Edit Shift' : 'Create New Shift'}</h3>
              <button className="btn-close-icon" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {error && <p style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>{error}</p>}
              <form onSubmit={handleSave} className="edit-student-form">
                <div className="form-group full-width">
                  <label>Shift Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Morning Shift" />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select value={parseTimeInput(formData.start).h} onChange={(e) => handleTimeChange('start', 'h', e.target.value, formData.start)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(hr => {
                        const hrStr = hr < 10 ? `0${hr}` : String(hr);
                        return <option key={hrStr} value={hrStr}>{hrStr}</option>;
                      })}
                    </select>
                    <select value={parseTimeInput(formData.start).m} onChange={(e) => handleTimeChange('start', 'm', e.target.value, formData.start)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                      {Array.from({ length: 60 }, (_, i) => {
                        const mStr = i < 10 ? `0${i}` : String(i);
                        return <option key={mStr} value={mStr}>{mStr}</option>;
                      })}
                    </select>
                    <select value={parseTimeInput(formData.start).a} onChange={(e) => handleTimeChange('start', 'a', e.target.value, formData.start)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                {!formData.id ? (
                  <>
                    <div className="form-group">
                      <label>Duration (hours)</label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour}>{hour} hour{hour > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="text"
                        readOnly
                        value={formatTime12Hour(computeEndTime(formData.start, formData.duration))}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', backgroundColor: '#f7f7f7' }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label>End Time</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <select value={parseTimeInput(formData.end).h} onChange={(e) => handleTimeChange('end', 'h', e.target.value, formData.end)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hr => {
                          const hrStr = hr < 10 ? `0${hr}` : String(hr);
                          return <option key={hrStr} value={hrStr}>{hrStr}</option>;
                        })}
                      </select>
                      <select value={parseTimeInput(formData.end).m} onChange={(e) => handleTimeChange('end', 'm', e.target.value, formData.end)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                        {Array.from({ length: 60 }, (_, i) => {
                          const mStr = i < 10 ? `0${i}` : String(i);
                          return <option key={mStr} value={mStr}>{mStr}</option>;
                        })}
                      </select>
                      <select value={parseTimeInput(formData.end).a} onChange={(e) => handleTimeChange('end', 'a', e.target.value, formData.end)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="form-actions full-width" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn-primary-action">Save Shift</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>Confirm Deletion</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>Are you sure you want to delete this shift? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-primary-action" style={{ backgroundColor: '#95a5a6', width: 'auto' }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn-danger" style={{ width: 'auto' }} onClick={() => handleDelete(deleteConfirmId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;