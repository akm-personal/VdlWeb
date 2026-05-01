import React, { useState } from 'react';
import './VdlFlow.css';

const VdlFlow = () => {
  const [selectedRole, setSelectedRole] = useState('Admin');

  // Application flow definitions based on roles
  const appFlows = {
    'Admin': [
      { step: 1, title: 'Dashboard & Analytics', desc: 'Has complete overview of the system, including total students, revenue, and active shifts.' },
      { step: 2, title: 'User Management', desc: 'Can create, edit, and delete Internal Users, External Users, and Students. Assigns roles and permissions.' },
      { step: 3, title: 'Shift & Library Management', desc: 'Creates library shifts, sets timings, and manages overall seating arrangements.' },
      { step: 4, title: 'System Configuration', desc: 'Manages global settings, fees structures, and generates system-wide reports.' }
    ],
    'Internal User': [
      { step: 1, title: 'Staff Dashboard', desc: 'Views assigned operational tasks, daily footfall, and basic analytics.' },
      { step: 2, title: 'Student Operations', desc: 'Verifies student details, marks attendance, and assists with desk allocations.' },
      { step: 3, title: 'Shift Monitoring', desc: 'Monitors ongoing shifts, checks active students, and reports issues to the Admin.' }
    ],
    'External User': [
      { step: 1, title: 'Portal Login', desc: 'Securely logs into the external viewing portal.' },
      { step: 2, title: 'View Resources', desc: 'Browses available library shifts, seat availability, and general guidelines.' },
      { step: 3, title: 'Support & Queries', desc: 'Can raise tickets or submit queries to the internal management team.' }
    ],
    'Student': [
      { step: 1, title: 'Student Profile', desc: 'Logs in to view personal profile, fee status, and attendance records.' },
      { step: 2, title: 'Shift Booking', desc: 'Requests for new shifts, requests shift changes, or views allocated seating.' },
      { step: 3, title: 'Study Material & Notices', desc: 'Accesses study materials, rules, and notices broadcasted by the Admin/Library.' }
    ]
  };

  const roles = Object.keys(appFlows);

  return (
    <div className="vdl-flow-page">
      <div className="vdl-flow-header">
        <div>
          <h2>Application Flow Architecture</h2>
          <p className="text-muted">Select a role below to understand their access and journey in the CRM.</p>
        </div>
        
        <div className="role-selector">
          <label htmlFor="role-select"><strong>Viewing as: </strong></label>
          <select 
            id="role-select" 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-dropdown"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline">
          {appFlows[selectedRole].map((flow, index) => (
            <div className="timeline-item" key={index}>
              <div className="timeline-icon">
                <span className="step-count">{flow.step}</span>
              </div>
              <div className="timeline-content">
                <h3>{flow.title}</h3>
                <p>{flow.desc}</p>
                {index < appFlows[selectedRole].length - 1 && (
                  <div className="next-step-hint">
                    ↓ Next Step
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VdlFlow;