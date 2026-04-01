import React, { useState, useEffect } from 'react';
import { getLogs, subscribeToLogs } from '../utils/logs';

function LogsViewer() {
  const [currentLogs, setCurrentLogs] = useState([]);

  useEffect(() => {
    // Subscribe to log updates when the component mounts
    const unsubscribe = subscribeToLogs(updatedLogs => {
      setCurrentLogs(updatedLogs);
    });

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount and once on unmount

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', margin: '20px' }}>
      <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>API Logs</h2>
      {currentLogs.length === 0 ? (
        <p style={{ color: '#777' }}>No API logs available yet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {currentLogs.map((log, index) => (
            <li key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'orange' : '#555' }}>
                <span style={{ marginRight: '10px' }}>[{log.timestamp}]</span>
                <span style={{ textTransform: 'uppercase' }}>[{log.level}]</span>
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#333' }}>{log.message}</p>
              {Object.keys(log).filter(key => key !== 'timestamp' && key !== 'level' && key !== 'message').map(key => (
                <p key={key} style={{ margin: '0 0 3px 0', fontSize: '0.9em', color: '#666' }}>
                  <strong style={{ textTransform: 'capitalize' }}>{key}:</strong> <span style={{ fontFamily: 'monospace' }}>{JSON.stringify(log[key], null, 2)}</span>
                </p>
              ))}
              <hr style={{ borderTop: '1px dashed #eee', margin: '10px 0 0 0' }} />
            ))}
          </li>
        ))}
      </ul>
   )}
    </div>
  );
}

export default LogsViewer;