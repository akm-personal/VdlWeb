import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../utils/helpers';
import '../../styles/SeatManagement.css';
import '../../styles/Student.css';
import { apiClient, updateStudent } from '../../services/apis';
import SeatSelectionModal from '../../components/SeatSelectionModal';
import { useActiveShifts } from '../../hooks/useShifts';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';

const AllStudent = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    feeRecordId: '', startDate: '', endDate: '', duration: '1', paymentMode: 'UPI', totalFee: '', collectedFee: '', dueAmount: '', description: '', collectedBy: 'Admin'
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Expanded rows state for fee history
  const [expandedFeeRecords, setExpandedFeeRecords] = useState(new Set());

  const { activeShifts, formatTime } = useActiveShifts();

  const toggleFeeRecordExpand = (feeRecordId) => {
    setExpandedFeeRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feeRecordId)) {
        newSet.delete(feeRecordId);
      } else {
        newSet.add(feeRecordId);
      }
      return newSet;
    });
  };

  const getStudentStatusName = (status) => {
    if (!status) return 'Fake';
    const map = { '6': 'Active', '7': 'Not Active', '8': 'Dropped', '9': 'Cancelled' };
    return map[String(status)] || status;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async (retryCount = 3) => {
      setIsLoading(true);
      try {
        const data = await apiClient('/Student/list');
        if (!isMounted) return;
        const mappedData = data
          .filter(student => Number(student.roleId || 4) === 4)
          .map(student => ({
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
            roleId: student.roleId || 4,
            roleName: student.roleName || 'Student',
            studentStatus: getStudentStatusName(student.studentStatus),
            admissionDate: student.createdDate ? student.createdDate.split('T')[0] : 'Fake',
            fromDate: student.lastFeeStartDate ? student.lastFeeStartDate.split('T')[0] : 'Fake',
            toDate: student.lastFeeEndDate ? student.lastFeeEndDate.split('T')[0] : 'Fake',
            feeStatus: student.lastFeeStatus || 'Not Available',
            remainingBalance: student.remainingBalance,
            feeHistory: []
          }));
          setStudents(mappedData);
          setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;
        if (retryCount > 0) {
          console.log(`Retrying fetch students due to failure... (${retryCount} retries left)`);
          setTimeout(() => fetchStudents(retryCount - 1), 2000); // Wait 2 seconds before retry
        } else {
          console.error('Error fetching students:', error);
          setIsLoading(false);
        }
      }
    };
    fetchStudents();
    return () => { isMounted = false; };
  }, []);

  const handleViewClick = async (student) => {
    setIsViewModalOpen(true);
    setLoadingDetails(true);
    setErrorDetails('');
    setSelectedStudent(null); // Clear old local list data immediately

    // Agar vdlId 'Fake' hai, to API call na karein.
    if (!student.vdlId || student.vdlId === 'Fake') {
      setErrorDetails('Invalid VDL ID. Full details cannot be loaded.');
      setLoadingDetails(false);
      return;
    }

    let retries = 3;
    let data = null;

    while (retries > 0) {
      try {      
        data = await apiClient(`/Student/details/${student.vdlId}`);
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`Retrying fetch student details... (${retries} retries left)`);
          await new Promise(res => setTimeout(res, 2000));
        } else {
          console.error('Error fetching student details:', error);
          setErrorDetails('Failed to load student details.');
        }
      }
    }

    if (data) {
      setSelectedStudent({ 
        ...data,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        admissionDate: data.createdDate ? data.createdDate.split('T')[0] : '',
        studentClass: data.class || data.studentClass,
        studentStatus: getStudentStatusName(data.studentStatus),
        feeStatus: data.lastFeeStatus || 'Not Available',
        remainingBalance: data.remainingBalance,
        fromDate: data.lastFeeStartDate ? data.lastFeeStartDate.split('T')[0] : '',
        toDate: data.lastFeeEndDate ? data.lastFeeEndDate.split('T')[0] : ''
      });
    }
    
    setLoadingDetails(false);
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
    
    // Map shift name back to shift ID for the select dropdown
    let matchedShiftId = student.shiftType;
    if (activeShifts && activeShifts.length > 0 && student.shiftType && student.shiftType !== 'Fake') {
      const foundShift = activeShifts.find(s => s.name.toLowerCase() === student.shiftType.toLowerCase());
      if (foundShift) {
        matchedShiftId = String(foundShift.id);
      }
    }

    setEditFormData({ ...student, shiftType: matchedShiftId });
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
    
    const shiftName = activeShifts.find(s => String(s.id) === editFormData.shiftType)?.name || editFormData.shiftType;

    // Prepare data for API
    const studentData = {
      vdlId: editFormData.vdlId || selectedStudent.vdlId,
      name: editFormData.name,
      email: editFormData.email,
      fatherName: editFormData.fatherName,
      gender: editFormData.gender ? editFormData.gender.toLowerCase() : 'male',
      seatNumber: parseInt(editFormData.seatNumber) || 0,
      shiftType: shiftName,
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
      if (error.message !== 'Unauthorized session.') {
        alert('Failed to update student: ' + error.message);
      }
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

  const fetchStudentFeeHistory = async (vdlId) => {
    let retries = 3;
    let data = null;

    while (retries > 0) {
      try {
        data = await apiClient(`/Fee/student/${vdlId}/records`);
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (retries > 0) {
          console.log(`Retrying fetch fee history... (${retries} retries left)`);
          await new Promise(res => setTimeout(res, 2000));
        } else {
          console.error('Error fetching fee history:', error);
          return [];
        }
      }
    }

    if (data) {
      const hierarchicalHistory = data.map(record => {
        // Calculate total paid from all payments
        const totalPaid = record.payments ? record.payments.reduce((sum, payment) => sum + payment.amountPaid, 0) : 0;
        const remainingDue = record.totalFee - totalPaid;

        return {
          id: record.id,
          feeRecordId: record.id,
          totalFee: record.totalFee,
          totalPaid: totalPaid,
          remainingDue: remainingDue,
          date: record.createdDate,
          startDate: record.startDate,
          endDate: record.endDate,
          status: record.status,
          description: record.description || '-',
          createdByName: record.createdByName,
          createdByVdlId: record.createdByVdlId,
          payments: record.payments ? record.payments.map((payment, index) => ({
            id: payment.id,
            amountPaid: payment.amountPaid,
            paymentMode: payment.paymentMode,
            paymentDate: payment.paymentDate,
            description: payment.description,
            collectedByName: payment.collectedByName,
            collectedByVdlId: payment.collectedByVdlId,
            isLastPayment: index === record.payments.length - 1,
            paymentIndex: index
          })) : []
        };
      });

      setSelectedStudent(prev => ({ ...prev, feeHistory: hierarchicalHistory }));
      setStudents(prev => prev.map(s => s.vdlId === vdlId ? { ...s, feeHistory: hierarchicalHistory } : s));
      return hierarchicalHistory;
    }
    return [];
  };

  const handleFeeClick = async (student) => {
    setSelectedStudent(student);
    
    const initialFeeData = {
      feeRecordId: '',
      startDate: student.fromDate === 'Fake' ? '' : (student.fromDate || ''),
      endDate: student.toDate === 'Fake' ? '' : (student.toDate || ''),
      duration: '1',
      paymentMode: 'UPI',
      totalFee: '',
      collectedFee: '',
      dueAmount: '',
      description: '',
      collectedBy: 'Admin'
    };
    
    setFeeFormData(initialFeeData);
    setIsFeeModalOpen(true);
    
    const history = await fetchStudentFeeHistory(student.vdlId);
    if (history && history.length > 0) {
      const latest = history[history.length - 1]; // Use last item as latest based on sequential API returns
      if (latest.status !== 'Paid' && latest.dueAmount > 0) {
        let durationMonths = 1;
        if (latest.startDate && latest.endDate) {
          const start = new Date(latest.startDate);
          const end = new Date(latest.endDate);
          durationMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)) || 1;
        }

        setFeeFormData({
          ...initialFeeData,
          feeRecordId: latest.id,
          feeRecordId: latest.feeRecordId,
          startDate: latest.startDate ? latest.startDate.split('T')[0] : '',
          endDate: latest.endDate ? latest.endDate.split('T')[0] : '',
          duration: durationMonths.toString(),
          totalFee: latest.dueAmount.toString(),
          dueAmount: latest.dueAmount.toString()
        });
      }
    }
  };

  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    setFeeFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'startDate' || name === 'duration') {
        if (updated.startDate) {
          const date = new Date(updated.startDate);
          const months = parseInt(updated.duration || '1', 10);
          date.setUTCDate(date.getUTCDate() + (months * 30));
          updated.endDate = date.toISOString().split('T')[0];
        }
      }

      if (name === 'totalFee' || name === 'collectedFee') {
        const total = parseFloat(updated.totalFee) || 0;
        const collected = parseFloat(updated.collectedFee) || 0;
        updated.dueAmount = total - collected;
      }
      return updated;
    });
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      // Agar feeRecordId available hai toh "Pay Due" wali API (POST /api/Fee/payment) call karenge
      if (feeFormData.feeRecordId) {
        const payload = {
          feeRecordId: feeFormData.feeRecordId,
          amountPaid: parseFloat(feeFormData.collectedFee) || 0,
          paymentMode: feeFormData.paymentMode,
          note: feeFormData.description || 'Due Payment'
        };
        response = await apiClient('/Fee/payment', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        // Warna naya Fee Record banayenge
        const payload = {
          vdlId: selectedStudent.vdlId,
          totalFee: parseFloat(feeFormData.totalFee) || 0,
          collectedFee: parseFloat(feeFormData.collectedFee) || 0,
          startDate: feeFormData.startDate,
          endDate: feeFormData.endDate,
          paymentMode: feeFormData.paymentMode,
          description: feeFormData.description || 'Fee Payment',
          paymentNote: feeFormData.description || 'Fee Payment'
        };
        response = await apiClient('/Fee/record', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      await fetchStudentFeeHistory(selectedStudent.vdlId);
      const newFeeStatus = feeFormData.dueAmount > 0 ? 'Due' : 'Done';
      setStudents(prev => prev.map(s => s.vdlId === selectedStudent.vdlId ? { ...s, feeStatus: newFeeStatus } : s));
      setSelectedStudent(prev => ({ ...prev, feeStatus: newFeeStatus }));

      setFeeFormData({
        feeRecordId: '', startDate: '', endDate: '', duration: '1', paymentMode: 'UPI', totalFee: '', collectedFee: '', dueAmount: '', description: '', collectedBy: 'Admin'
      });

      alert(`✅ Success: ${response.message || 'Payment processed successfully.'}\n\nStudent ko kuch der me message receive ho jayega.`);
    } catch (error) {
      console.error('Error submitting fee:', error);
      if (error.message !== 'Unauthorized session.') {
        alert(`❌ Failed: Payment process nahi ho paya.\n\nReason: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const openPayDueModal = (entry) => {
    let durationMonths = 1;
    if (entry.startDate && entry.endDate) {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);
      durationMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)) || 1;
    }

    setFeeFormData({
      feeRecordId: entry.feeRecordId,
      startDate: entry.startDate ? entry.startDate.split('T')[0] : ((selectedStudent.fromDate === 'Fake' ? '' : selectedStudent.fromDate) || ''),
      endDate: entry.endDate ? entry.endDate.split('T')[0] : ((selectedStudent.toDate === 'Fake' ? '' : selectedStudent.toDate) || ''),
      duration: durationMonths.toString(),
      paymentMode: 'UPI',
      totalFee: entry.totalFee || '',
      collectedFee: entry.totalPaid || '',
      dueAmount: entry.remainingDue || '',
      description: '',
      collectedBy: 'Admin'
    });
  };

  // Pagination calculations
  const indexOfLastItem = itemsPerPage === 'All' ? students.length : currentPage * itemsPerPage;
  const indexOfFirstItem = itemsPerPage === 'All' ? 0 : indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);

  const handleItemsPerPageChange = (e) => {
    const val = e.target.value;
    setItemsPerPage(val === 'All' ? 'All' : Number(val));
    setCurrentPage(1); // Reset to first page
  };

  const latestFee = selectedStudent?.feeHistory?.[selectedStudent.feeHistory.length - 1];
  const isFeePending = latestFee ? (latestFee.status !== 'Paid' && latestFee.dueAmount > 0) : false;

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
                <th>S.No.</th>
                <th>ID</th>
                <th>Name</th>
                <th>Admission Date</th>
                <th>From</th>
                <th>To</th>
                <th>Student Status</th>
                <th>Fee Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{ padding: 0 }}><Loader message="Fetching students data..." /></td></tr>
              ) : currentStudents.length > 0 ? (
                currentStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{student.vdlId}</td>
                    <td style={{fontWeight: 'bold'}}>{student.name}</td>
                    <td>{student.admissionDate && student.admissionDate !== 'Fake' ? formatDate(student.admissionDate) : 'Fake'}</td>
                    <td>{student.fromDate && student.fromDate !== 'Fake' ? formatDate(student.fromDate) : 'Fake'}</td>
                    <td>{student.toDate && student.toDate !== 'Fake' ? formatDate(student.toDate) : 'Fake'}</td>
                    <td>
                      <span className={`status-badge ${student.studentStatus === 'Active' ? 'fully-booked' : 'locked'}`}>
                        {student.studentStatus} ({student.roleName})
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${student.feeStatus === 'Done' || student.feeStatus === 'Paid' ? 'fully-booked' : (student.feeStatus === 'Partial' ? 'partially-booked' : 'pending')}`}>
                        {student.feeStatus} {student.remainingBalance > 0 ? `(Due - ₹${student.remainingBalance})` : ''}
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
                ))
              ) : (
                <tr><td colSpan="9" style={{textAlign: 'center'}}>No students found.</td></tr>
              )}
            </tbody>
          </table>
          
          <Pagination 
            totalItems={students.length} 
            itemsPerPage={itemsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
            onItemsPerPageChange={handleItemsPerPageChange} 
          />
        </div>
      </div>

      {/* VIEW MODAL */}
      {isViewModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '95%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button className="btn-close-icon" onClick={() => setIsViewModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <Loader message="Loading full details..." />
              ) : selectedStudent ? (
                <>
                  {errorDetails && <p style={{ color: '#e74c3c', marginBottom: '15px', textAlign: 'center' }}>{errorDetails}</p>}
                  <div className="student-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e1e8ed' }}>
                    <p><strong>VDL ID:</strong> {selectedStudent.vdlId}</p>
                    <p><strong>Name:</strong> {selectedStudent.name}</p>
                    <p><strong>Email:</strong> {selectedStudent.email ? selectedStudent.email : 'N/A'}</p>
                    <p><strong>Mobile:</strong> {selectedStudent.mobileNumber ? selectedStudent.mobileNumber : 'N/A'}</p>
                    <p><strong>Alternate No:</strong> {selectedStudent.alternateNumber ? selectedStudent.alternateNumber : 'N/A'}</p>
                    <p><strong>Father's Name:</strong> {selectedStudent.fatherName ? selectedStudent.fatherName : 'N/A'}</p>
                    <p><strong>Gender:</strong> {selectedStudent.gender ? selectedStudent.gender : 'N/A'}</p>
                    <p><strong>DOB:</strong> {selectedStudent.dateOfBirth ? formatDate(selectedStudent.dateOfBirth) : 'N/A'}</p>
                    <p><strong>Class:</strong> {selectedStudent.studentClass ? selectedStudent.studentClass : 'N/A'}</p>
                    <p><strong>Seat Number:</strong> {selectedStudent.seatNumber ? selectedStudent.seatNumber : 'N/A'}</p>
                    <p><strong>Shift:</strong> {selectedStudent.shiftType ? selectedStudent.shiftType : 'N/A'}</p>
                    <p><strong>ID Proof:</strong> {selectedStudent.idProof ? selectedStudent.idProof : 'N/A'}</p>
                    <p><strong>Student Status:</strong> <span className={`status-badge ${selectedStudent.studentStatus === 'Active' ? 'fully-booked' : 'locked'}`}>{selectedStudent.studentStatus || 'N/A'} ({selectedStudent.roleName || 'Student'})</span></p>
                    <p><strong>Fee Status:</strong> <span className={`status-badge ${selectedStudent.feeStatus === 'Done' || selectedStudent.feeStatus === 'Paid' ? 'fully-booked' : (selectedStudent.feeStatus === 'Partial' ? 'partially-booked' : 'pending')}`}>{selectedStudent.feeStatus || 'N/A'} {selectedStudent.remainingBalance > 0 ? `(Due - ₹${selectedStudent.remainingBalance})` : ''}</span></p>
                    <p><strong>Fee Start Date:</strong> {selectedStudent.fromDate ? formatDate(selectedStudent.fromDate) : 'N/A'}</p>
                    <p><strong>Fee End Date:</strong> {selectedStudent.toDate ? formatDate(selectedStudent.toDate) : 'N/A'}</p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {selectedStudent.address ? selectedStudent.address : 'N/A'}</p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Admission Date:</strong> {selectedStudent.admissionDate ? formatDate(selectedStudent.admissionDate) : 'N/A'}</p>
                    {selectedStudent.createdDate && <p style={{ gridColumn: '1 / -1' }}><strong>Record Created:</strong> {formatDateTime(selectedStudent.createdDate)}</p>}
                  </div>
                </>
              ) : (
                <p style={{ color: '#e74c3c', textAlign: 'center', padding: '20px' }}>{errorDetails || 'No data found'}</p>
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
                  <select name="shiftType" value={editFormData.shiftType || ''} onChange={handleEditChange}>
                    <option value="">Select Shift</option>
                    {activeShifts.map(shift => {
                      const isMatchedShift = editFormData.shiftType === String(shift.id) || editFormData.shiftType === shift.name;
                      return (
                      <option key={shift.id} value={String(shift.id)} style={{ fontWeight: isMatchedShift ? 'bold' : 'normal' }}>
                        {shift.name} ({formatTime(shift.start)} - {formatTime(shift.end)})
                      </option>
                      );
                    })}
                    {['Morning', 'Afternoon', 'Evening'].includes(editFormData.shiftType) && !activeShifts.some(s => String(s.id) === editFormData.shiftType || s.name === editFormData.shiftType) && (
                      <option value={editFormData.shiftType} style={{ fontWeight: 'bold' }}>{editFormData.shiftType}</option>
                    )}
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
                  <input type={editFormData.admissionDate === 'Fake' ? 'text' : 'date'} name="admissionDate" value={editFormData.admissionDate || ''} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', color: '#777' }} />
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
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', marginTop: '40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Fee Management: {selectedStudent.name} (ID: {selectedStudent.vdlId})</h3>
              <button className="btn-close-icon" onClick={() => setIsFeeModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body table-responsive">
              
              {/* Fee Collection Form */}
              <form onSubmit={handleFeeSubmit} className="edit-student-form" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', alignItems: 'start' }}>
                <h4 style={{ margin: '0', gridColumn: '1 / -1', color: '#2c3e50' }}>{feeFormData.feeRecordId ? 'Pay Due Amount' : 'Collect New Fee'}</h4>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Start Date</label>
                  <input type="date" name="startDate" value={feeFormData.startDate} onChange={handleFeeChange} required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: isFeePending ? '#eee' : 'white' }} disabled={isFeePending} />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Duration</label>
                  <select name="duration" value={feeFormData.duration} onChange={handleFeeChange} disabled={!feeFormData.startDate || isFeePending} style={{ width: '100%', boxSizing: 'border-box', cursor: (feeFormData.startDate && !isFeePending) ? 'pointer' : 'not-allowed', backgroundColor: isFeePending ? '#eee' : 'white' }}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Month{i > 0 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>End Date</label>
                  <input type="date" name="endDate" value={feeFormData.endDate} onChange={handleFeeChange} required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#eee', marginBottom: '5px' }} readOnly disabled={isFeePending} />
                  {feeFormData.endDate && (
                    <span style={{ color: '#27ae60', fontSize: '12px', fontWeight: 'bold', display: 'block' }}>
                      Next Upcoming Fee Date: {
                        (()=>{
                          const nextDate = new Date(feeFormData.endDate);
                          nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                          return formatDate(nextDate.toISOString().split('T')[0]);
                        })()
                      }
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Total Fee (₹)</label>
                  <input type="number" name="totalFee" value={feeFormData.totalFee} onChange={handleFeeChange} required style={{ width: '100%', boxSizing: 'border-box', backgroundColor: isFeePending ? '#eee' : 'white' }} disabled={isFeePending} />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Collected Fee (₹)</label>
                  <input type="number" name="collectedFee" value={feeFormData.collectedFee} onChange={handleFeeChange} required style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Due Amount (₹)</label>
                  <input type="number" name="dueAmount" value={feeFormData.dueAmount} disabled style={{ backgroundColor: '#eee', cursor: 'not-allowed', width: '100%', boxSizing: 'border-box' }} />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Payment Mode</label>
                  <select name="paymentMode" value={feeFormData.paymentMode} onChange={handleFeeChange} required style={{ width: '100%', boxSizing: 'border-box' }}>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Description (Optional)</label>
                  <textarea name="description" value={feeFormData.description} onChange={handleFeeChange} placeholder="e.g. Paid via UPI" rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}></textarea>
                </div>
                <div className="form-actions" style={{ marginTop: '10px', gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }}>Save Fee Record</button>
                </div>
              </form>

              {/* Fee History Table */}
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Fee History</h4>
              <table className="user-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    <th>Submit Date</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.feeHistory && selectedStudent.feeHistory.length > 0 ? (
                    selectedStudent.feeHistory.map((record, idx) => (
                      <React.Fragment key={`fee-${idx}`}>
                        {/* Parent Row - Fee Record */}
                        <tr className="fee-parent-row" style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                          <td onClick={() => record.payments.length > 0 && toggleFeeRecordExpand(record.feeRecordId)} style={{ cursor: record.payments.length > 0 ? 'pointer' : 'default', textAlign: 'center', userSelect: 'none' }}>
                            {record.payments.length > 0 && (
                              <span style={{ fontSize: '18px', color: '#2c3e50' }}>
                                {expandedFeeRecords.has(record.feeRecordId) ? '▼' : '▶'}
                              </span>
                            )}
                          </td>
                          <td>{record.date ? formatDateTime(record.date) : 'N/A'}</td>
                          <td>{record.startDate ? formatDate(record.startDate) : 'N/A'}</td>
                          <td>{record.endDate ? formatDate(record.endDate) : 'N/A'}</td>
                          <td style={{ fontWeight: 'bold', color: '#3498db' }}>₹{record.totalFee}</td>
                          <td style={{ fontWeight: 'bold', color: '#27ae60' }}>₹{record.totalPaid}</td>
                          <td style={{ fontWeight: 'bold', color: record.remainingDue > 0 ? '#e74c3c' : '#27ae60' }}>₹{record.remainingDue}</td>
                          <td><span className={`status-badge ${record.status === 'Paid' ? 'fully-booked' : (record.status === 'Partial' ? 'partially-booked' : 'pending')}`}>{record.status}</span></td>
                          <td>{record.description}</td>
                          <td></td>
                        </tr>

                        {/* Child Rows - Payment Records */}
                        {expandedFeeRecords.has(record.feeRecordId) && record.payments && record.payments.length > 0 && (
                          record.payments.map((payment, paymentIdx) => {
                            const accumulatedPaid = record.payments.slice(0, paymentIdx + 1).reduce((sum, p) => sum + p.amountPaid, 0);
                            const dueAfterPayment = record.totalFee - accumulatedPaid;
                            const isLastPayment = paymentIdx === record.payments.length - 1;
                            const hasMoreDue = dueAfterPayment > 0;
                            const showPayDueButton = isLastPayment && hasMoreDue;

                            return (
                              <tr key={`payment-${idx}-${paymentIdx}`} className="fee-child-row" style={{ backgroundColor: '#fafafa', borderLeft: '3px solid #3498db' }}>
                                <td></td>
                                <td style={{ paddingLeft: '30px', fontSize: '13px' }}>
                                  {payment.paymentDate ? formatDateTime(payment.paymentDate) : 'N/A'}
                                </td>
                                <td colSpan="2" style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                  Payment Record #{payment.id}
                                </td>
                                <td></td>
                                <td style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '13px' }}>₹{payment.amountPaid}</td>
                                <td style={{ fontWeight: 'bold', color: dueAfterPayment > 0 ? '#e74c3c' : '#27ae60', fontSize: '13px' }}>₹{dueAfterPayment}</td>
                                <td style={{ fontSize: '13px' }}><span className={`status-badge ${dueAfterPayment <= 0 ? 'fully-booked' : 'partially-booked'}`}>{dueAfterPayment <= 0 ? 'Paid' : 'Partial'}</span></td>
                                <td style={{ fontSize: '13px' }}>
                                  {payment.paymentMode} - {payment.description}
                                </td>
                                <td>
                                  {showPayDueButton && (
                                    <button 
                                      type="button" 
                                      className="btn-primary-action" 
                                      style={{ padding: '4px 8px', fontSize: '11px', width: 'auto' }} 
                                      onClick={() => openPayDueModal(record)}
                                    >
                                      Pay Due
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr><td colSpan="10" style={{textAlign: 'center', padding: '20px', color: '#7f8c8d'}}>No fee history available for this student.</td></tr>
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