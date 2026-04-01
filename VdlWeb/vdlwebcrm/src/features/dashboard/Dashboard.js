import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyUsers, dummyStudents } from '../../utils/dummyDatabase';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  const activeUsers = dummyUsers.filter(u => u.status === 'Active').length;
  const inactiveUsers = dummyUsers.filter(u => u.status === 'Inactive').length;
  const totalStudents = dummyStudents.length;
  const feeSubmitted = dummyStudents.filter(s => s.feeStatus === 'Submitted').length;
  const feePending = dummyStudents.filter(s => s.feeStatus === 'Pending').length;

  const openModal = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard">
      <h2>Dashboard Overview</h2>
      <div className="cards">
        <div className="card clickable-card" onClick={() => openModal('Active Users', dummyUsers.filter(u => u.status === 'Active'))}>
          <h3>Active Users</h3>
          <p className="card-value">{activeUsers}</p>
        </div>
        <div className="card clickable-card" onClick={() => openModal('Inactive Users', dummyUsers.filter(u => u.status === 'Inactive'))}>
          <h3>Inactive Users</h3>
          <p className="card-value">{inactiveUsers}</p>
        </div>
        <div className="card clickable-card" onClick={() => openModal('Total Students', dummyStudents)}>
          <h3>Total Students</h3>
          <p className="card-value">{totalStudents}</p>
        </div>
        <div className="card clickable-card" onClick={() => openModal('Fee Submitted', dummyStudents.filter(s => s.feeStatus === 'Submitted'))}>
          <h3>Fee Submitted</h3>
          <p className="card-value">{feeSubmitted}</p>
        </div>
        <div className="card clickable-card" onClick={() => openModal('Fee Pending', dummyStudents.filter(s => s.feeStatus === 'Pending'))}>
          <h3>Fee Pending</h3>
          <p className="card-value">{feePending}</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalTitle}</h3>
              <button className="btn-close-icon" onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body table-responsive">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Fee Status / Role</th>
                    <th>Last Fee Date / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {modalData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.vdlId || item.id}</td>
                      <td>{item.name || item.username}</td>
                      <td>{item.feeStatus || item.role}</td>
                      <td>{item.lastFeeDate || item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
