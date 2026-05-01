import React, { useState, useEffect } from 'react';
// import { allDummyStudents } from '../../utils/dummyDatabase';
import '../../styles/IdentityCard.css';
import { getCurrentUser } from '../../utils/rbac'; // Import getCurrentUser to get logged-in user info
import html2canvas from 'html2canvas'; // Import html2canvas

// Dummy student data (replace with API call)
const allDummyStudents = [
  {
    id: 1,
    vdlId: 'VDL001',
    name: 'John Doe',
    studentClass: '10A',
    shiftType: 'Morning',
    seatNumber: '1',
    email: 'john.doe@example.com',
    mobileNumber: '9876543210',
  },
  {
    id: 2,
    vdlId: 'VDL002',
    name: 'Jane Smith',
    studentClass: '11B',
    shiftType: 'Afternoon',
    seatType: 'Regular', // Added for completeness
    seatNumber: '5',
    email: 'jane.smith@example.com',
    mobileNumber: '8765432109',
  },
];

const IdentityCard = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Augment dummy student data with selfie images from localStorage
    const currentUser = getCurrentUser(); // Get the current logged-in user
    let studentsToDisplay = allDummyStudents;

    // If a student is logged in (roleId 4), show only their card.
    // Otherwise (admin or no user), show all cards.
    if (currentUser && currentUser.roleId === 4) {
      studentsToDisplay = allDummyStudents.filter(student => student.id === currentUser.id);
    }
    const studentsWithSelfies = studentsToDisplay.map(student => {
      const savedProfile = localStorage.getItem(`vdl_profile_${student.id}`);
      if (savedProfile) {
        const parsedData = JSON.parse(savedProfile);
        return { ...student, selfieImage: parsedData.selfieImage };
      }
      return student;
    });
    setStudents(studentsWithSelfies);
  }, []);

  // Placeholder image if no selfie is available
  const defaultSelfie = 'https://via.placeholder.com/150/080a17/ffffff?text=No+Photo';

  const handleDownload = async (studentId, studentName) => {
    const downloadButton = document.querySelector(`#id-card-${studentId} .download-card-btn`);
    if (downloadButton) {
      downloadButton.classList.add('hide-for-download'); // Temporarily hide the button
    }
    const cardElement = document.getElementById(`id-card-${studentId}`);
    if (cardElement) {
      try {
        const canvas = await html2canvas(cardElement, {
          scale: 2, // Increase scale for better quality
          useCORS: true, // Important if images are from external sources (like defaultSelfie)
          logging: false, // Disable logging to console
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `${studentName.replace(/\s/g, '_')}_ID_Card.png`; // Sanitize filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      catch (error) {
        console.error('Error generating ID card image:', error);
        alert('Failed to download ID card. Please try again.');
      }
      finally {
        if (downloadButton) {
        downloadButton.classList.remove('hide-for-download'); // Restore visibility
      }
    }
  }
  };

  return (
    <div className="identity-card-page-container">
      <h2 className="page-title">Student Identity Cards</h2>
      <div className="id-cards-grid">
        {students.length > 0 ? (
          students.map((student) => (
            <div className="id-card" key={student.id} id={`id-card-${student.id}`}>
              <div
                className="photo-wrapper"
                style={{ backgroundImage: `url('${student.selfieImage || defaultSelfie}')` }}
              ></div>

              <div className="details">
                <h1 className="name">{student.name}</h1>
                <p className="info-line">
                  <span className="bold-text">Class:</span> {student.studentClass || 'N/A'}
                </p>
                <p className="info-line">
                  <span className="bold-text">ID:</span> {student.vdlId || 'N/A'}
                </p>
                <p className="info-line">
                  <span className="bold-text">Shift:</span> {student.shiftType || 'N/A'}
                </p>
                <p className="info-line">
                  <span className="bold-text">Seat:</span> {student.seatNumber || 'N/A'}
                </p>

                <div className="barcode-box">
                  <div className="barcode-text">{student.vdlId || '123456789'}</div>
                  <div className="barcode-bars"></div>
                </div>

                {/* Download Button */}
                <button
                  className="download-card-btn"
                  onClick={() => handleDownload(student.id, student.name)}
                  title="Download ID Card"
                >⬇️</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-cards-message">No student identity cards to display.</p>
        )}
      </div>
    </div>
  );
};

export default IdentityCard;