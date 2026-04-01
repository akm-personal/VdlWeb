import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import { allDummyStudents } from '../../utils/dummyDatabase'; // Commented out dummy database import
import { formatDate, formatDateTime } from '../../utils/helpers';
import '../../styles/SeatManagement.css';
import '../../styles/Student.css';

// Dummy student data (replace with API call)
const allDummyStudents = [ // Re-added for local testing, should be replaced by API call
  {
    id: 1,
    vdlId: 'VDL001',
    name: 'John Doe',
    admissionDate: '2023-01-15',
    fromDate: '2023-01-15',
    toDate: '2023-04-15',
    feeStatus: 'Done',
    email: 'john.doe@example.com',
    mobileNumber: '9876543210',
    feeHistory: [],
  },
  {
    id: 2,
    vdlId: 'VDL002',
    name: 'Jane Smith',
    admissionDate: '2023-02-01',
    fromDate: '2023-02-01',
    toDate: '2023-05-01',
    feeStatus: 'Pending',
    email: 'jane.smith@example.com',
    mobileNumber: '8765432109',
    feeHistory: [],
  },
];

const AllStudent = () => {
  const [students, setStudents] = useState(
    allDummyStudents.map(s => ({ ...s, feeHistory: s.feeHistory || [] }))
  );
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isEmailEditModalOpen, setIsEmailEditModalOpen] = useState(false);

  // Forms state
  const [editFormData, setEditFormData] = useState({});
  const [emailUpdateData, setEmailUpdateData] = useState({ id: '', oldEmail: '', newEmail: '' });
  const [feeFormData, setFeeFormData] = useState({
    startDate: '', endDate: '', totalFee: '', collectedFee: '', dueAmount: '', description: '', collectedBy: 'Admin'
  });

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditFormData({ ...student });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'mobileNumber' || name === 'alternateNumber') && !/^\d*$/.test(value)) {
      return; // Only allow digits
    }
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...editFormData } : s));
    setIsEditModalOpen(false);
  };

  const handleEmailEditClick = () => {
    setEmailUpdateData({
      id: selectedStudent.vdlId,
      oldEmail: editFormData.email || '',
      newEmail: ''
    });
    setIsEmailEditModalOpen(true);
  };

  const handleEmailUpdateChange = (e) => {
    setEmailUpdateData(prev => ({ ...prev, newEmail: e.target.value }));
  };

  const handleEmailUpdateSubmit = (e) => {
    e.preventDefault();
    // Simulate sending data to backend
    console.log('Backend payload -> ID:', emailUpdateData.id, '| Old Email:', emailUpdateData.oldEmail, '| New Email:', emailUpdateData.newEmail);
    
    // Update local state to reflect change
    setEditFormData(prev => ({ ...prev, email: emailUpdateData.newEmail }));
    setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, email: emailUpdateData.newEmail } : s));
    setIsEmailEditModalOpen(false);
  };

  const handleFeeClick = (student) => {
    setSelectedStudent(student);
    setFeeFormData({
      startDate: student.fromDate || '',
      endDate: student.toDate || '',
      totalFee: '',
      collectedFee: '',
      dueAmount: '',
      description: '',
      collectedBy: 'Admin'
    });
    setIsFeeModalOpen(true);
  };

  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    setFeeFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'totalFee' || name === 'collectedFee') {
        const total = parseFloat(updated.totalFee) || 0;
        const collected = parseFloat(updated.collectedFee) || 0;
        updated.dueAmount = total - collected;
      }
      return updated;
    });
  };

  const handleFeeSubmit = (e) => {
    e.preventDefault();
    const newHistoryEntry = {
      date: new Date().toISOString(),
      startDate: feeFormData.startDate,
      endDate: feeFormData.endDate,
      amount: feeFormData.collectedFee,
      dueAmount: feeFormData.dueAmount,
      status: feeFormData.dueAmount > 0 ? 'Pending' : 'Paid',
      description: feeFormData.description,
      collectedBy: feeFormData.collectedBy
    };

    const newFeeStatus = feeFormData.dueAmount > 0 ? 'Due' : 'Done';

    setStudents(students.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, feeStatus: newFeeStatus, feeHistory: [...(s.feeHistory || []), newHistoryEntry] };
      }
      return s;
    }));

    setSelectedStudent(prev => ({ ...prev, feeStatus: newFeeStatus, feeHistory: [...(prev.feeHistory || []), newHistoryEntry] }));

    setFeeFormData({
      startDate: '', endDate: '', totalFee: '', collectedFee: '', dueAmount: '', description: '', collectedBy: 'Admin'
    });
  };

  const openPayDueModal = (entry) => {
    setFeeFormData({
      startDate: entry.startDate || selectedStudent.fromDate || '',
      endDate: entry.endDate || selectedStudent.toDate || '',
      totalFee: entry.dueAmount || '',
      collectedFee: '',
      dueAmount: entry.dueAmount || '',
      description: '',
      collectedBy: 'Admin'
    });
  };

  return (
    <div className="student-page">
      <div className="student-header">
        <h2>All Students</h2>
        <Link to="/studentDetails" className="btn-primary-action" style={{ textDecoration: 'none', width: 'auto', padding: '10px 20px' }}>
          + Add New Student
        </Link>
      </div>
      
      <div className="student-list-container">
        <div className="table-responsive" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Admission Date</th>
                <th>From</th>
                <th>To</th>
                <th>Fee Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.vdlId}</td>
                  <td style={{fontWeight: 'bold'}}>{student.name}</td>
                  <td>{student.admissionDate ? formatDate(student.admissionDate) : 'N/A'}</td>
                  <td>{student.fromDate ? formatDate(student.fromDate) : 'N/A'}</td>
                  <td>{student.toDate ? formatDate(student.toDate) : 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${student.feeStatus === 'Done' ? 'fully-booked' : 'pending'}`}>
                      {student.feeStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary-action" style={{ background: '#3498db', padding: '6px 12px', fontSize: '12px', width: 'auto' }} onClick={() => handleViewClick(student)}>View</button>
                      <button className="btn-primary-action" style={{ background: '#f39c12', padding: '6px 12px', fontSize: '12px', width: 'auto' }} onClick={() => handleEditClick(student)}>Edit</button>
                      <button className="btn-primary-action" style={{ background: '#27ae60', padding: '6px 12px', fontSize: '12px', width: 'auto' }} onClick={() => handleFeeClick(student)}>Fee</button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="7" style={{textAlign: 'center'}}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button className="btn-close-icon" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body student-details-grid">
              <p><strong>ID:</strong> {selectedStudent.vdlId}</p>
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>Admission Date:</strong> {selectedStudent.admissionDate ? formatDate(selectedStudent.admissionDate) : 'N/A'}</p>
              <p><strong>From Date:</strong> {selectedStudent.fromDate ? formatDate(selectedStudent.fromDate) : 'N/A'}</p>
              <p><strong>To Date:</strong> {selectedStudent.toDate ? formatDate(selectedStudent.toDate) : 'N/A'}</p>
              <p><strong>Fee Status:</strong> <span className={`status-badge ${selectedStudent.feeStatus === 'Done' ? 'fully-booked' : 'pending'}`}>{selectedStudent.feeStatus}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Edit Student: {selectedStudent.vdlId}</h3>
              <button className="btn-close-icon" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit} className="edit-student-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Email <span style={{color: '#3498db', cursor: 'pointer', float: 'right', fontSize: '12px'}} onClick={handleEmailEditClick}>(Edit - Admin)</span></label>
                  <input type="email" name="email" value={editFormData.email || ''} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', color: '#777' }} />
                </div>
                <div className="form-group">
                  <label>Father's Name</label>
                  <input type="text" name="fatherName" value={editFormData.fatherName || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={editFormData.dateOfBirth || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" name="mobileNumber" value={editFormData.mobileNumber || ''} onChange={handleEditChange} maxLength="10" pattern="\d{10}" title="Please enter a 10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>Alternate Number</label>
                  <input type="tel" name="alternateNumber" value={editFormData.alternateNumber || ''} onChange={handleEditChange} maxLength="10" pattern="\d{10}" title="Please enter a 10-digit alternate number" />
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <input type="text" name="studentClass" value={editFormData.studentClass || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>ID Proof</label>
                  <input type="text" name="idProof" value={editFormData.idProof || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Shift Type</label>
                  <select name="shiftType" value={editFormData.shiftType || 'Morning'} onChange={handleEditChange}>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Seat Number</label>
                  <input type="number" name="seatNumber" value={editFormData.seatNumber || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Student Status</label>
                  <select name="studentStatus" value={editFormData.studentStatus || 'Active'} onChange={handleEditChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Admission Date</label>
                  <input type="date" name="admissionDate" value={editFormData.admissionDate || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>From Date</label>
                  <input type="date" name="fromDate" value={editFormData.fromDate || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group full-width">
                  <label>To Date</label>
                  <input type="date" name="toDate" value={editFormData.toDate || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea name="address" value={editFormData.address || ''} onChange={handleEditChange} rows="2" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', fontFamily: 'inherit' }}></textarea>
                </div>
                <div className="form-actions full-width" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn-primary-action">Update Details</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL UPDATE MODAL */}
      {isEmailEditModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Update Email</h3>
              <button className="btn-close-icon" onClick={() => setIsEmailEditModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEmailUpdateSubmit} className="edit-student-form">
                <div className="form-group full-width">
                  <label>VDL ID</label>
                  <input type="text" value={emailUpdateData.id} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', color: '#777' }} />
                </div>
                <div className="form-group full-width">
                  <label>Old Email</label>
                  <input type="email" value={emailUpdateData.oldEmail} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', color: '#777' }} />
                </div>
                <div className="form-group full-width">
                  <label>New Email</label>
                  <input type="email" value={emailUpdateData.newEmail} onChange={handleEmailUpdateChange} required placeholder="Enter new email address" />
                </div>
                <div className="form-actions full-width" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn-primary-action">Update Email</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FEE MANAGEMENT MODAL */}
      {isFeeModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h3>Fee Management: {selectedStudent.name}</h3>
              <button className="btn-close-icon" onClick={() => setIsFeeModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body table-responsive">
              
              {/* Fee Collection Form */}
              <form onSubmit={handleFeeSubmit} className="edit-student-form" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 15px 0', gridColumn: '1 / -1', color: '#2c3e50' }}>Collect New Fee</h4>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={feeFormData.startDate} onChange={handleFeeChange} required />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" name="endDate" value={feeFormData.endDate} onChange={handleFeeChange} required />
                </div>
                <div className="form-group">
                  <label>Total Fee (₹)</label>
                  <input type="number" name="totalFee" value={feeFormData.totalFee} onChange={handleFeeChange} required />
                </div>
                <div className="form-group">
                  <label>Collected Fee (₹)</label>
                  <input type="number" name="collectedFee" value={feeFormData.collectedFee} onChange={handleFeeChange} required />
                </div>
                <div className="form-group">
                  <label>Due Amount (₹)</label>
                  <input type="number" name="dueAmount" value={feeFormData.dueAmount} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input type="text" name="description" value={feeFormData.description} onChange={handleFeeChange} placeholder="e.g. Paid in cash" />
                </div>
                <div className="form-actions full-width" style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }}>Save Fee Record</button>
                </div>
              </form>

              {/* Fee History Table */}
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Fee History</h4>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Submit Date</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Collected By</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.feeHistory && selectedStudent.feeHistory.length > 0 ? (
                    selectedStudent.feeHistory.slice().reverse().map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.date ? formatDateTime(entry.date) : 'N/A'}</td>
                        <td>{entry.startDate ? formatDate(entry.startDate) : 'N/A'}</td>
                        <td>{entry.endDate ? formatDate(entry.endDate) : 'N/A'}</td>
                        <td style={{fontWeight: 'bold', color: '#27ae60'}}>₹{entry.amount}</td>
                        <td style={{fontWeight: 'bold', color: '#e74c3c'}}>₹{entry.dueAmount || 0}</td>
                        <td><span className={`status-badge ${entry.status === 'Paid' ? 'fully-booked' : 'pending'}`}>{entry.status}</span></td>
                        <td>{entry.collectedBy || 'Admin'}</td>
                        <td>{entry.description || '-'}</td>
                        <td>
                          {(entry.dueAmount > 0 || entry.status === 'Pending') && (
                            <button type="button" className="btn-primary-action" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto' }} onClick={() => openPayDueModal(entry)}>
                              Pay Due
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9" style={{textAlign: 'center', padding: '20px', color: '#7f8c8d'}}>No fee history available for this student.</td></tr>
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

export default AllStudent;