import React, { useState, useEffect } from 'react';
import { clearLogs, getLogs, subscribeToLogs } from '../utils/logs';

function LogsViewer() {
  const [currentLogs, setCurrentLogs] = useState([]);

  useEffect(() => {
    // Load existing logs on mount, including those persisted across refresh.
    setCurrentLogs(getLogs());

    // Subscribe to log updates when the component mounts
    const unsubscribe = subscribeToLogs(updatedLogs => {
      setCurrentLogs(updatedLogs);
    });

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount and once on unmount

  const handleClearLogs = () => {
    clearLogs();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', margin: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: 0 }}>API Logs</h2>
        {currentLogs.length > 0 && (
          <button
            onClick={handleClearLogs}
            style={{
              backgroundColor: '#e74c3c',
              color: '#fff',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Logs
          </button>
        )}
      </div>

      {currentLogs.length === 0 ? (
        <p style={{ color: '#777' }}>No API logs available yet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {[...currentLogs].reverse().map((log, index) => {
            const logNumber = currentLogs.length - index;
            return (
              <li key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'orange' : '#555' }}>
                  <span style={{ marginRight: '10px' }}>#{logNumber}</span>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LogsViewer;