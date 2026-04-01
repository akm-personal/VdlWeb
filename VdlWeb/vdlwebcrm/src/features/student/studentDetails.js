import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../utils/rbac';
import { Link, useNavigate } from 'react-router-dom';
// import { dummyUsers, shifts as dbShifts, seatDummyStudents } from '../../utils/dummyDatabase'; // Commented out dummy database imports
import '../../styles/Student.css';
import '../../styles/SeatManagement.css';
import IdentityCard from './identityCard';

const StudentDetails = () => {
  const currentUser = getCurrentUser();
  const isStudent = currentUser?.roleId === 4;
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [vdlId, setVdlId] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [seatLayout, setSeatLayout] = useState([]);
  const [prefilledFields, setPrefilledFields] = useState({ email: false, mobile: false });
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);

  // Dummy data for shifts (replace with API call)
  const dummyShifts = [{ id: 1, name: 'Morning', status: 'active' }, { id: 2, name: 'Afternoon', status: 'active' }];
  const activeShifts = dummyShifts.filter(s => s.status === 'active');
  const defaultShiftId = activeShifts.length > 0 ? String(activeShifts[0].id) : '1'; // Default to '1' if no active shifts

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    fatherName: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    mobileNumber: '',
    alternateNumber: '',
    studentClass: '',
    idProof: '',
    shiftType: defaultShiftId,
    seatNumber: '',
    studentStatus: 'Active'
  });

  const getShiftId = () => {
    // Fallback for previously saved string-based old data
    if (['Morning', 'Afternoon', 'Evening'].includes(formData.shiftType)) {
      return formData.shiftType === 'Morning' ? '1' : formData.shiftType === 'Afternoon' ? '2' : '3';
    }
    return formData.shiftType;
  };

  useEffect(() => {
    // If the logged in user is a student, fetch their profile info & pre-fill the form
    if (isStudent && currentUser?.id) {
      // In a real app, you'd fetch student details from an API using currentUser.id
      // For now, we'll simulate pre-filling from currentUser info
      const studentInfoFromAuth = currentUser; // Assuming currentUser has email, mobile, username
      // const studentInfo = dummyUsers.find(u => u.id === currentUser.id); // Removed dummyUsers reference
      if (studentInfoFromAuth) {
        setVdlId(studentInfoFromAuth.username); // Assuming VDL ID is the username for now
        setPrefilledFields({
          email: !!studentInfo.email,
          mobile: !!studentInfo.mobile,
          email: !!studentInfoFromAuth.email,
          mobile: !!studentInfoFromAuth.mobileNumber // Assuming mobileNumber from API
        });
        
        const savedProfile = localStorage.getItem(`vdl_profile_${currentUser.id}`);
        if (savedProfile) {
          const parsedData = JSON.parse(savedProfile);
          setFormData(parsedData);
          setSelfieImage(parsedData.selfieImage || null);
          setIsProfileComplete(true);
          setSelfieImage(parsedData.selfieImage || null); // Keep existing selfie if any
          // Check if key fields are filled to determine profile completeness
          setIsProfileComplete(!!parsedData.name && !!parsedData.fatherName && !!parsedData.dateOfBirth && !!parsedData.address);
        } else {
          setFormData(prev => ({
            ...prev,
            // name: studentInfo.username || currentUser?.name || '', // Removed dummyUsers reference
            name: studentInfoFromAuth.username || '',
            email: studentInfoFromAuth.email || '',
            mobileNumber: studentInfoFromAuth.mobileNumber || ''
          }));
        }
      }
    }
  }, [isStudent, currentUser?.id, currentUser?.name]);

  // Dummy seat data for demonstration (replace with API call)
  const dummySeatStudents = [
    { id: 1, vdlId: 'VDL001', name: 'John Doe', feeStatus: 'Pending' },
    { id: 2, vdlId: 'VDL002', name: 'Jane Smith', feeStatus: 'Paid' },
  ];

  const loadSeats = () => {
    const stored = localStorage.getItem('vdl_seats');
    if (stored) {
      setSeatLayout(JSON.parse(stored));
    } else {
      // Initial seat setup (dummy data)
      const seats = [];
      let idCounter = 1;
      for (let r = 1; r <= 4; r++) {
        for (let n = 1; n <= 20; n++) {
          let seatNumber = (r - 1) * 20 + n;
          const defaultShifts = {};
          dbShifts.forEach(shift => {
            defaultShifts[shift.id] = { status: 'available', student: null };
          });
          seats.push({ id: idCounter++, row: r, number: seatNumber, locked: false, shifts: defaultShifts });
        }
      }
      if (seatDummyStudents.length > 0 && seats.length > 0) {
        if (seats[0].shifts['1']) seats[0].shifts['1'] = { status: 'booked', student: seatDummyStudents[0] };
        if (seats[0].shifts['2']) seats[0].shifts['2'] = { status: 'booked', student: seatDummyStudents[0] };
        if (seats[1].shifts['3']) seats[1].shifts['3'] = { status: 'pending', student: seatDummyStudents[1] };
        if (seats[2].shifts['1']) seats[2].shifts['1'] = { status: 'booked', student: seatDummyStudents[2] };
      if (dummySeatStudents.length > 0 && seats.length > 0) {
        if (seats[0].shifts['1']) seats[0].shifts['1'] = { status: 'booked', student: dummySeatStudents[0] };
        if (seats[0].shifts['2']) seats[0].shifts['2'] = { status: 'booked', student: dummySeatStudents[0] };
        if (seats[1].shifts['3']) seats[1].shifts['3'] = { status: 'pending', student: dummySeatStudents[1] };
        if (seats[2].shifts['1']) seats[2].shifts['1'] = { status: 'booked', student: dummySeatStudents[2] };
      }
      localStorage.setItem('vdl_seats', JSON.stringify(seats));
      setSeatLayout(seats);
    }
  };

  const openSeatModal = () => {
    loadSeats();
    setIsSeatModalOpen(true);
  };

  const handleSeatSelect = (seat) => {
    const shiftId = getShiftId();
    const shiftData = seat.shifts[shiftId];
    if (seat.locked || (shiftData && shiftData.status !== 'available')) {
      alert('This seat is not available for the selected shift.');
      return;
    }
    setFormData(prev => ({ ...prev, seatNumber: seat.number }));
    setIsSeatModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'mobileNumber' || name === 'alternateNumber') && !/^\d*$/.test(value)) {
      return; // Only allow digits
    }
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure student status is 'Active' by default for students
    const finalFormData = {
      ...formData,
      studentStatus: isStudent ? 'Active' : formData.studentStatus
    };

    console.log('Form Submitted: Ready for API Integration', finalFormData);
    
    // Share booking state with SeatManagement module via localStorage
    if (finalFormData.seatNumber && finalFormData.shiftType) {
      const shiftId = getShiftId();
      const stored = localStorage.getItem('vdl_seats');
      if (stored) {
        const seats = JSON.parse(stored);
        const updatedSeats = seats.map(s => {
          if (s.number === Number(finalFormData.seatNumber)) {
            return {
              ...s,
              shifts: {
                ...s.shifts,
                [shiftId]: {
                  status: 'booked',
                  student: {
                    id: currentUser?.id || Date.now(),
                    vdlId: vdlId || 'VDL_NEW',
                    vdlId: currentUser?.username || 'VDL_NEW', // Use currentUser.username as VDL ID
                    name: finalFormData.name,
                    feeStatus: 'Pending',
                  }
                }
              }
            };
          }
          return s;
        });
        localStorage.setItem('vdl_seats', JSON.stringify(updatedSeats));
      }
    }

    if (isStudent) {
      localStorage.setItem(`vdl_profile_${currentUser.id}`, JSON.stringify(finalFormData));
      setIsProfileComplete(true);
      window.dispatchEvent(new Event('profileUpdated')); // Notify other components
      setIsSelfieModalOpen(true); // Open selfie popup after submission
    } else {
      alert("Student Details Added Successfully!");
    }
    // TODO: Add API call here
  };

  const disableForm = isStudent && isProfileComplete;

  const handleTakeSelfie = () => {
    // Simulate taking a picture using a random placeholder API
    const randomImage = `https://i.pravatar.cc/150?u=${Date.now()}`;
    setSelfieImage(randomImage);
    
    // Update local profile with the new selfie
    const savedProfile = JSON.parse(localStorage.getItem(`vdl_profile_${currentUser.id}`) || '{}');
    savedProfile.selfieImage = randomImage;
    localStorage.setItem(`vdl_profile_${currentUser.id}`, JSON.stringify(savedProfile));

    // TODO: Send API request to save the image in 'student/setudentimage' folder
    console.log("Saving image to 'student/setudentimage' directory...");

    setIsSelfieModalOpen(false);
    navigate('/identityCards');
  };

  return (
    <div className="student-page">
      <div className="student-header">
        <h2>
          {isStudent 
            ? (isProfileComplete 
                ? `Dear ${currentUser?.name}, Your Profile (VDL ID: ${vdlId})`
                : `Dear ${currentUser?.name}, Complete Your Profile (Your VDL ID is ${vdlId})`)
            : 'Add Student Details'}
        </h2>
        {!isStudent && <Link to="/allstudent" className="btn-show-all">Show All Students</Link>}
      </div>

      <div className="student-form-container">
        {isStudent && vdlId && !isProfileComplete && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px', borderLeft: '5px solid #3498db' }}>
            <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>Welcome! We've pre-filled your registration details. Please complete the rest of your profile.</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="student-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter student name" disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john.doe@example.com" disabled={disableForm || prefilledFields.email} />
          </div>
          <div className="form-group">
            <label>Father's Name</label>
            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required placeholder="Enter father's name" disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} disabled={disableForm}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required placeholder="Enter 10-digit mobile number" maxLength="10" pattern="\d{10}" title="Please enter a 10-digit mobile number" disabled={disableForm || prefilledFields.mobile} />
          </div>
          <div className="form-group">
            <label>Alternate Number</label>
            <input type="tel" name="alternateNumber" value={formData.alternateNumber} onChange={handleChange} placeholder="Enter 10-digit alternate number" maxLength="10" pattern="\d{10}" title="Please enter a 10-digit alternate number" disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>Class</label>
            <input type="text" name="studentClass" value={formData.studentClass} onChange={handleChange} required placeholder="e.g. 10A" disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>ID Proof</label>
            <input type="text" name="idProof" value={formData.idProof} onChange={handleChange} required placeholder="Aadhar, PAN, etc." disabled={disableForm} />
          </div>
          <div className="form-group">
            <label>Shift Type</label>
            <select name="shiftType" value={formData.shiftType} onChange={handleChange} disabled={disableForm}>
              {activeShifts.map(shift => (
                <option key={shift.id} value={String(shift.id)}>{shift.name}</option>
              ))}
              {['Morning', 'Afternoon', 'Evening'].includes(formData.shiftType) && (
                <option value={formData.shiftType}>{formData.shiftType}</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Seat Number</label>
            <input type="number" name="seatNumber" value={formData.seatNumber} onChange={handleChange} placeholder="Select a seat from below" disabled={disableForm} readOnly />
            {!disableForm && (
              <span 
                onClick={openSeatModal} 
                style={{ color: '#3498db', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', display: 'inline-block', fontWeight: 'bold' }}
              >
                👁️ Check & Select Seat
              </span>
            )}
          </div>
          {!isStudent && (
            <div className="form-group">
              <label>Student Status</label>
              <select name="studentStatus" value={formData.studentStatus} onChange={handleChange} disabled={disableForm}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="form-group full-width">
            <label>Address</label>
            <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Enter full address" rows="3" disabled={disableForm}></textarea>
          </div>
          <div className="form-actions full-width">
            {disableForm ? (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '15px' }}>
                  To make any changes in your profile, please contact Vinayak Digital Library Management Team.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <button type="button" className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsSelfieModalOpen(true)}>📸 Take Selfie</button>
                  {selfieImage && (
                    <button type="button" className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#27ae60' }} onClick={() => navigate('/identityCards')}>💳 View ID Card</button>
                  )}
                </div>
              </div>
            ) : (
              <button type="submit" className="btn-submit">Submit Details</button>
            )}
          </div>
        </form>
      </div>

      {/* Seat Selection Modal */}
      {isSeatModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-content-large" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="modal-header">
              <h3>Select Seat for {
                activeShifts.find(s => String(s.id) === getShiftId())?.name || formData.shiftType
              }</h3>
              <button className="btn-close-icon" type="button" onClick={() => setIsSeatModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body seat-layout" style={{ display: 'block' }}>
              <div className="seat-legend" style={{ justifyContent: 'center', marginBottom: '15px' }}>
                <span className="legend-item"><div className="legend-box available"></div> Available</span>
                <span className="legend-item"><div className="legend-box fully-booked"></div> Occupied</span>
                <span className="legend-item"><div className="legend-box locked"></div> Locked</span>
              </div>
              <div className="seat-grid-container table-responsive" style={{ width: '100%', maxHeight: '60vh', overflowY: 'auto' }}>
                {Array.from(new Set(seatLayout.map(s => s.row))).map(rowNum => {
                  const rowSeats = seatLayout.filter(s => s.row === rowNum).sort((a,b) => a.number - b.number);
                  if(rowSeats.length === 0) return null;
                  return (
                    <div key={rowNum} className="seat-row-wrapper" style={{ margin: '10px 0' }}>
                      <div className="column-label" style={{ minWidth: '60px' }}>Row {rowNum}</div>
                      <div className="seat-row">
                        {rowSeats.map(seat => {
                          const shiftId = getShiftId();
                          const shiftData = seat.shifts[shiftId];
                          const isAvailable = !seat.locked && (!shiftData || shiftData.status === 'available');
                          const statusClass = seat.locked ? 'locked' : (isAvailable ? 'available' : 'fully-booked');
                          
                          return (
                            <div 
                              key={seat.id} 
                              className={`seat-box ${statusClass} ${Number(formData.seatNumber) === seat.number ? 'selected' : ''}`}
                              onClick={() => handleSeatSelect(seat)}
                              title={`Seat ${seat.number} - ${isAvailable ? 'Available' : 'Occupied'}`}
                            >
                              {seat.locked && <span className="lock-icon">🔒</span>}
                              <span className="seat-number font-14">{seat.number}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Popup Modal */}
      {isSelfieModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>Take Selfie</h3>
              <button className="btn-close-icon" type="button" onClick={() => setIsSelfieModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>Note: Yeh image aapke identity card pe show hoga.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button type="button" onClick={handleTakeSelfie} className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }}>📸 Capture Selfie</button>
                <button type="button" onClick={() => setIsSelfieModalOpen(false)} className="btn-remove-seat" style={{ width: 'auto', padding: '10px 20px' }}>Skip / Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
}
export default StudentDetails;