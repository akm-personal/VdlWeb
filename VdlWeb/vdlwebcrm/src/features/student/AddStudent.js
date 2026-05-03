import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../../utils/rbac';
import { Link, useNavigate } from 'react-router-dom';
// import { dummyUsers, shifts as dbShifts, seatDummyStudents } from '../../utils/dummyDatabase'; 
import '../../styles/Student.css';
import '../../styles/SeatManagement.css';
import { apiClient } from '../../services/apis';
import SeatSelectionModal from '../../components/SeatSelectionModal';

const AddStudent = () => {
  const currentUser = getCurrentUser();
  const isStudent = currentUser?.roleId === 4;
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [vdlId, setVdlId] = useState('');
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [prefilledFields, setPrefilledFields] = useState({ email: false, mobile: false });
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null); // Success data from API
  
  // Camera specific states & refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, currentUser?.id, currentUser?.name, currentUser?.username, currentUser?.email, currentUser?.mobileNumber]);

  // Dummy seat data for demonstration (replace with API call)
  const dummySeatStudents = [
    { id: 1, vdlId: 'VDL001', name: 'John Doe', feeStatus: 'Pending' },
    { id: 2, vdlId: 'VDL002', name: 'Jane Smith', feeStatus: 'Paid' },
  ];

  const handleSeatSelect = (seatNumber) => {
    setFormData(prev => ({ ...prev, seatNumber }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'mobileNumber' || name === 'alternateNumber') && !/^\d*$/.test(value)) {
      return; // Only allow digits
    }
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Ensure student status is 'Active' by default for students
    const finalFormData = {
      ...formData,
      studentStatus: isStudent ? 'Active' : formData.studentStatus
    };

    const shiftName = activeShifts.find(s => String(s.id) === finalFormData.shiftType)?.name || finalFormData.shiftType;

    // Map form data to exactly match API expectations
    const apiPayload = {
      name: finalFormData.name,
      email: finalFormData.email,
      fatherName: finalFormData.fatherName,
      gender: finalFormData.gender,
      seatNumber: finalFormData.seatNumber ? parseInt(finalFormData.seatNumber, 10) : 0,
      shiftType: shiftName,
      address: finalFormData.address,
      alternateNumber: finalFormData.alternateNumber,
      class: finalFormData.studentClass,
      dateOfBirth: finalFormData.dateOfBirth ? new Date(finalFormData.dateOfBirth).toISOString() : null,
      idProof: finalFormData.idProof,
      mobileNumber: finalFormData.mobileNumber,
      studentStatus: finalFormData.studentStatus
    };

    try {
      const data = await apiClient('/Student/register', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      
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
                      id: data.studentId || currentUser?.id || Date.now(),
                      vdlId: data.vdlId || currentUser?.username || 'VDL_NEW',
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
        // Open success modal with credentials for Admin
        setRegistrationResult(data);
        
        // Clear form after successful submission
        setFormData({
          name: '', email: '', fatherName: '', dateOfBirth: '', gender: 'Male', address: '',
          mobileNumber: '', alternateNumber: '', studentClass: '', idProof: '',
          shiftType: defaultShiftId, seatNumber: '', studentStatus: 'Active'
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disableForm = isStudent && isProfileComplete;

  const startCamera = async () => {
    setCapturedImage(null); // Reset if retaking
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please allow camera permissions to take a selfie.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -width, 0, width, height);
      context.restore();
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const getSelfieFileName = () => {
    const id = vdlId || currentUser?.username || 'VDLID';
    const safeName = (currentUser?.name || 'Student').trim().replace(/\s+/g, '_');
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${id}_${safeName}_${timestamp}.png`;
  };

  const saveSelfie = () => {
    if (!capturedImage) return;
    const selfieFileName = getSelfieFileName();
    const selfieImagePath = `studentimage/${selfieFileName}`;

    setSelfieImage(capturedImage);

    const savedProfile = JSON.parse(localStorage.getItem(`vdl_profile_${currentUser.id}`) || '{}');
    savedProfile.selfieImage = capturedImage;
    savedProfile.selfieImageName = selfieFileName;
    savedProfile.selfieImagePath = selfieImagePath;
    localStorage.setItem(`vdl_profile_${currentUser.id}`, JSON.stringify(savedProfile));

    console.log(`Saved selfie metadata: ${selfieImagePath}`);

    setIsSelfieModalOpen(false);
    navigate('/identityCards');
  };

  useEffect(() => {
    if (!isSelfieModalOpen) {
      stopCamera();
      setCapturedImage(null);
    }
  }, [isSelfieModalOpen]);

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
        
        {errorMessage && (
          <div style={{ color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', padding: '12px', borderRadius: '5px', marginBottom: '20px' }}>
            <strong>Error:</strong> {errorMessage}
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
                onClick={() => setIsSeatModalOpen(true)} 
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
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Details'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Seat Selection Modal */}
      <SeatSelectionModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        onSeatSelect={handleSeatSelect}
        selectedSeat={formData.seatNumber}
        shiftType={formData.shiftType}
        activeShifts={activeShifts}
      />

      {/* Success Result Modal (Credentials Viewer) */}
      {registrationResult && !isStudent && (
        <div className="modal-overlay" style={{ zIndex: 1300, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="modal-header">
              <h3 style={{ color: '#27ae60', margin: 0 }}>🎉 Registration Successful!</h3>
              <button className="btn-close-icon" type="button" onClick={() => setRegistrationResult(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px' }}>{registrationResult.message}</p>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'left', border: '1px solid #e1e8ed' }}>
                <p style={{ margin: '5px 0' }}><strong>Name:</strong> {registrationResult.name}</p>
                <p style={{ margin: '5px 0' }}><strong>VDL ID:</strong> {registrationResult.vdlId}</p>
                <p style={{ margin: '5px 0' }}><strong>Username:</strong> {registrationResult.username}</p>
                <p style={{ margin: '5px 0', fontSize: '16px' }}><strong>Temp Password:</strong> <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{registrationResult.tempPassword}</span></p>
              </div>
              <button type="button" onClick={() => setRegistrationResult(null)} className="btn-primary-action" style={{ marginTop: '20px', width: 'auto', padding: '10px 30px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Popup Modal */}
      {isSelfieModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="modal-header">
              <h3>Take Selfie</h3>
              <button className="btn-close-icon" type="button" onClick={() => setIsSelfieModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '20px' }}>Note: Yeh image aapke identity card pe show hoga.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button type="button" className="btn-primary-action" style={{ width: 'auto', padding: '10px 20px' }}>📸 Capture Selfie</button>
                <button type="button" onClick={() => setIsSelfieModalOpen(false)} className="btn-remove-seat" style={{ width: 'auto', padding: '10px 20px' }}>Skip / Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AddStudent;