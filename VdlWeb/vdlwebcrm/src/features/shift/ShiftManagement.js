import React, { useState } from 'react';
import { shifts as dbShifts, saveShiftsToStorage } from '../../utils/dummyDatabase';
import '../../styles/ShiftManagement.css';
import { formatTime12Hour } from '../../utils/helpers';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState(dbShifts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    start: '',
    end: '',
    status: 'active'
  });

  const openModal = (shift = null) => {
    setError('');
    if (shift) {
      setFormData(shift);
    } else {
      setFormData({ id: '', name: '', start: '08:00', end: '13:00', status: 'active' });
    }
    setIsModalOpen(true);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
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

    const newIntervals = getIntervals(formData.start, formData.end);

    const hasOverlap = shifts.find(s => {
      if (s.id === formData.id) return false;
      
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

    // Update local and central Database (Array mutation for mock real-time syncing)
    if (formData.id) {
      const index = dbShifts.findIndex(s => s.id === formData.id);
      if (index !== -1) {
        dbShifts[index] = { ...formData };
      }
    } else {
      const newId = String(Date.now());
      dbShifts.push({ ...formData, id: newId });
    }
    
    saveShiftsToStorage(dbShifts);
    setShifts([...dbShifts]);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    const index = dbShifts.findIndex(s => s.id === id);
    if (index !== -1) dbShifts.splice(index, 1);
    saveShiftsToStorage(dbShifts);
    setShifts([...dbShifts]);
    setDeleteConfirmId(null);
  };

  return (
    <div className="shift-page">
      <div className="shift-header">
        <h2>Library Shift Management</h2>
        <button className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => openModal()}>+ Create Shift</button>
      </div>

      <div className="table-responsive" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <table className="user-table">
          <thead>
            <tr>
              <th>Shift Name</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id}>
                <td style={{ fontWeight: 'bold' }}>{shift.name}</td>
                <td>{formatTime12Hour(shift.start)}</td>
                <td>{formatTime12Hour(shift.end)}</td>
                <td>
                  <span className={`status-badge ${shift.status === 'active' ? 'fully-booked' : 'locked'}`}>{shift.status}</span>
                </td>
                <td>
                  <button className="btn-primary-action" style={{ backgroundColor: '#f39c12', padding: '6px 12px', width: 'auto', marginRight: '10px' }} onClick={() => openModal(shift)}>Edit</button>
                  <button className="btn-danger" style={{ padding: '6px 12px', width: 'auto' }} onClick={() => setDeleteConfirmId(shift.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No shifts available. Create one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

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