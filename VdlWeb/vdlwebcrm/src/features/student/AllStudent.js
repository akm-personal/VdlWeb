import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../utils/helpers';
import '../../styles/SeatManagement.css';
import '../../styles/Student.css';
import { apiClient, updateStudent } from '../../services/apis';
import SeatSelectionModal from '../../components/SeatSelectionModal';

const AllStudent = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isEmailEditModalOpen, setIsEmailEditModalOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  // View Modal API states
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  // Forms state
  const [editFormData, setEditFormData] = useState({});
  const [emailUpdateData, setEmailUpdateData] = useState({ id: '', oldEmail: '', newEmail: '' });
  const [feeFormData, setFeeFormData] = useState({
    startDate: '', endDate: '', totalFee: '', collectedFee: '', dueAmount: '', description: '', collectedBy: 'Admin'
  });

  const dummyShifts = [{ id: 1, name: 'Morning', status: 'active' }, { id: 2, name: 'Afternoon', status: 'active' }];
  const activeShifts = dummyShifts.filter(s => s.status === 'active');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await apiClient('/StudentList');
        const mappedData = data.map(student => ({
            id: student.id || 'Fake',
            vdlId: student.vdlId || 'Fake',
            name: student.name || 'Fake',
            email: student.email || 'Fake',
            fatherName: student.fatherName || 'Fake',
            gender: student.gender || 'Fake',
            seatNumber: student.seatNumber || 'Fake',
            shiftType: student.shiftType || 'Fake',
            address: student.address || 'Fake',
            alternateNumber: student.alternateNumber || 'Fake',
            studentClass: student.class || 'Fake',
            dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : 'Fake',
            idProof: student.idProof || 'Fake',
            mobileNumber: student.mobileNumber || 'Fake',
            studentStatus: student.studentStatus || 'Fake',
            admissionDate: student.createdDate ? student.createdDate.split('T')[0] : 'Fake',
            fromDate: 'Fake',
            toDate: 'Fake',
            feeStatus: 'Fake',
            feeHistory: []
          }));
          setStudents(mappedData);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  const handleViewClick = async (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
    setLoadingDetails(true);
    setErrorDetails('');

    // Agar vdlId 'Fake' hai, to API call na karein.
    if (!student.vdlId || student.vdlId === 'Fake') {
      setErrorDetails('Invalid VDL ID. Full details cannot be loaded.');
      setLoadingDetails(false);
      return;
    }

    try {      
      const data = await apiClient(`/Student/${student.vdlId}`);
      setSelectedStudent(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching student details:', error);
      // Error message removed to avoid UI confusion. 
      // Agar API fail bhi hoti hai toh modal existing basic list data show karta rahega.
    } finally {
      setLoadingDetails(false);
    }
  };

  const getShiftId = () => {
    if (!editFormData.shiftType) return '1'; // Default if not set
    if (['Morning', 'Afternoon', 'Evening'].includes(editFormData.shiftType)) {
      return editFormData.shiftType === 'Morning' ? '1' : editFormData.shiftType === 'Afternoon' ? '2' : '3';
    }
    return editFormData.shiftType;
  };

  const handleSeatSelect = (seatNumber) => {
    setEditFormData(prev => ({ ...prev, seatNumber }));
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditFormData({ ...student });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    let { name, value } = e.target;
    if (editFormData[name] === 'Fake' && value.startsWith('Fake')) {
      value = value.replace('Fake', '');
    }
    if ((name === 'mobileNumber' || name === 'alternateNumber') && value !== 'Fake' && !/^\d*$/.test(value)) {
      return; // Only allow digits
    }
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data for API
    const studentData = {
      vdlId: editFormData.vdlId || selectedStudent.vdlId,
      name: editFormData.name,
      email: editFormData.email,
      fatherName: editFormData.fatherName,
      gender: editFormData.gender ? editFormData.gender.toLowerCase() : 'male',
      seatNumber: parseInt(editFormData.seatNumber) || 0,
      shiftType: editFormData.shiftType,
      address: editFormData.address,
      alternateNumber: editFormData.alternateNumber,
      class: editFormData.studentClass,
      dateOfBirth: editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString() : null,
      idProof: editFormData.idProof,
      mobileNumber: editFormData.mobileNumber,
      studentStatus: editFormData.studentStatus
    };

    try {
      const updatedStudent = await updateStudent(selectedStudent.vdlId, studentData);
      // Update local state with API response
      setStudents(students.map(s => s.id === selectedStudent.id ? { 
        ...s, 
        ...updatedStudent, 
        studentClass: updatedStudent.class, // Map 'class' back to 'studentClass'
        dateOfBirth: updatedStudent.dateOfBirth ? updatedStudent.dateOfBirth.split('T')[0] : 'Fake' // Convert back to date string
      } : s));
      setIsEditModalOpen(false);
      alert('Student details updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student: ' + error.message);
    }
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
      startDate: student.fromDate === 'Fake' ? '' : (student.fromDate || ''),
      endDate: student.toDate === 'Fake' ? '' : (student.toDate || ''),
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
      startDate: entry.startDate || (selectedStudent.fromDate === 'Fake' ? '' : selectedStudent.fromDate) || '',
      endDate: entry.endDate || (selectedStudent.toDate === 'Fake' ? '' : selectedStudent.toDate) || '',
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
        <Link to="/addStudent" className="btn-primary-action" style={{ textDecoration: 'none', width: 'auto', padding: '10px 20px' }}>
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
                  <td>{student.admissionDate && student.admissionDate !== 'Fake' ? formatDate(student.admissionDate) : 'Fake'}</td>
                  <td>{student.fromDate && student.fromDate !== 'Fake' ? formatDate(student.fromDate) : 'Fake'}</td>
                  <td>{student.toDate && student.toDate !== 'Fake' ? formatDate(student.toDate) : 'Fake'}</td>
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
        <div className="modal-overlay" style={{ zIndex: 1000, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '95%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button className="btn-close-icon" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#3498db' }}>
                  <p>Loading full details...</p>
                </div>
              ) : (
                <>
                  {errorDetails && <p style={{ color: '#e74c3c', marginBottom: '15px', textAlign: 'center' }}>{errorDetails}</p>}
                  <div className="student-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e1e8ed' }}>
                    <p><strong>VDL ID:</strong> {selectedStudent.vdlId}</p>
                    <p><strong>Name:</strong> {selectedStudent.name}</p>
                    <p><strong>Email:</strong> {selectedStudent.email !== 'Fake' ? selectedStudent.email : 'N/A'}</p>
                    <p><strong>Mobile:</strong> {selectedStudent.mobileNumber !== 'Fake' ? selectedStudent.mobileNumber : 'N/A'}</p>
                    <p><strong>Alternate No:</strong> {selectedStudent.alternateNumber !== 'Fake' ? selectedStudent.alternateNumber : 'N/A'}</p>
                    <p><strong>Father's Name:</strong> {selectedStudent.fatherName !== 'Fake' ? selectedStudent.fatherName : 'N/A'}</p>
                    <p><strong>Gender:</strong> {selectedStudent.gender !== 'Fake' ? selectedStudent.gender : 'N/A'}</p>
                    <p><strong>DOB:</strong> {selectedStudent.dateOfBirth && selectedStudent.dateOfBirth !== 'Fake' ? formatDate(selectedStudent.dateOfBirth) : 'N/A'}</p>
                    <p><strong>Class:</strong> {selectedStudent.class || (selectedStudent.studentClass !== 'Fake' ? selectedStudent.studentClass : 'N/A')}</p>
                    <p><strong>Seat Number:</strong> {selectedStudent.seatNumber !== 'Fake' ? selectedStudent.seatNumber : 'N/A'}</p>
                    <p><strong>Shift:</strong> {selectedStudent.shiftType !== 'Fake' ? selectedStudent.shiftType : 'N/A'}</p>
                    <p><strong>ID Proof:</strong> {selectedStudent.idProof !== 'Fake' ? selectedStudent.idProof : 'N/A'}</p>
                    <p><strong>Student Status:</strong> <span className={`status-badge ${selectedStudent.studentStatus === 'Active' ? 'fully-booked' : 'locked'}`}>{selectedStudent.studentStatus || 'N/A'}</span></p>
                    <p><strong>Fee Status:</strong> <span className={`status-badge ${selectedStudent.feeStatus === 'Done' ? 'fully-booked' : 'pending'}`}>{selectedStudent.feeStatus}</span></p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {selectedStudent.address !== 'Fake' ? selectedStudent.address : 'N/A'}</p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Admission Date:</strong> {selectedStudent.admissionDate && selectedStudent.admissionDate !== 'Fake' ? formatDate(selectedStudent.admissionDate) : 'N/A'}</p>
                    {selectedStudent.createdDate && <p style={{ gridColumn: '1 / -1' }}><strong>Record Created:</strong> {formatDateTime(selectedStudent.createdDate)}</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedStudent && (
        <div className="modal-overlay" style={{ zIndex: 1000, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                  <input type={editFormData.email === 'Fake' ? 'text' : 'email'} name="email" value={editFormData.email || ''} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', color: '#777' }} />
                </div>
                <div className="form-group">
                  <label>Father's Name</label>
                  <input type="text" name="fatherName" value={editFormData.fatherName || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type={editFormData.dateOfBirth === 'Fake' ? 'text' : 'date'} name="dateOfBirth" value={editFormData.dateOfBirth || ''} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={editFormData.gender || 'Male'} onChange={handleEditChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Fake" style={{display: 'none'}}>Fake</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type={editFormData.mobileNumber === 'Fake' ? 'text' : 'tel'} name="mobileNumber" value={editFormData.mobileNumber || ''} onChange={handleEditChange} maxLength={editFormData.mobileNumber === 'Fake' ? undefined : "10"} pattern={editFormData.mobileNumber === 'Fake' ? undefined : "\\d{10}"} title="Please enter a 10-digit mobile number" />
                </div>
                <div className="form-group">
                  <label>Alternate Number</label>
                  <input type={editFormData.alternateNumber === 'Fake' ? 'text' : 'tel'} name="alternateNumber" value={editFormData.alternateNumber || ''} onChange={handleEditChange} maxLength={editFormData.alternateNumber === 'Fake' ? undefined : "10"} pattern={editFormData.alternateNumber === 'Fake' ? undefined : "\\d{10}"} title="Please enter a 10-digit alternate number" />
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
                    <option value="Fake" style={{display: 'none'}}>Fake</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Seat Number</label>
                  <input type={editFormData.seatNumber === 'Fake' ? 'text' : 'number'} name="seatNumber" value={editFormData.seatNumber || ''} onChange={handleEditChange} readOnly placeholder="Select a seat" />
                  <span
                    onClick={() => setIsSeatModalOpen(true)}
                    style={{ color: '#3498db', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', display: 'inline-block', fontWeight: 'bold' }}
                  >
                    👁️ Check & Select Seat
                  </span>
                </div>
                <div className="form-group">
                  <label>Student Status</label>
                  <select name="studentStatus" value={editFormData.studentStatus || 'Active'} onChange={handleEditChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Fake" style={{display: 'none'}}>Fake</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Admission Date</label>
                  <input type={editFormData.admissionDate === 'Fake' ? 'text' : 'date'} name="admissionDate" value={editFormData.admissionDate || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>From Date</label>
                  <input type={editFormData.fromDate === 'Fake' ? 'text' : 'date'} name="fromDate" value={editFormData.fromDate || ''} onChange={handleEditChange} required />
                </div>
                <div className="form-group full-width">
                  <label>To Date</label>
                  <input type={editFormData.toDate === 'Fake' ? 'text' : 'date'} name="toDate" value={editFormData.toDate || ''} onChange={handleEditChange} required />
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
        <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '400px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
        <div className="modal-overlay" style={{ zIndex: 1000, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
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

      {/* SEAT SELECTION MODAL */}
      <SeatSelectionModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        onSeatSelect={handleSeatSelect}
        selectedSeat={editFormData.seatNumber}
        shiftType={editFormData.shiftType}
        activeShifts={activeShifts}
        currentUserVdlId={selectedStudent?.vdlId}
      />

    </div>
  );
};

export default AllStudent;