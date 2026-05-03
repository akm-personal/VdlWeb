import React, { useState, useEffect } from 'react';
import { clearLogs, getLogs, subscribeToLogs } from '../utils/logs';

function LogsViewer() {
  const [currentLogs, setCurrentLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2 seconds

  useEffect(() => {
    // Load existing logs on mount, including those persisted across refresh.
    setCurrentLogs(getLogs());
    setLastUpdated(new Date());

    // Subscribe to log updates when the component mounts
    const unsubscribe = subscribeToLogs(updatedLogs => {
      setCurrentLogs(updatedLogs);
      setLastUpdated(new Date());
    });

    // Log update listeners
    const handleStorageUpdate = (event) => {
      if (event.key === 'api_logs') {
        setCurrentLogs(getLogs());
        setLastUpdated(new Date());
      }
    };
    const handleLogUpdate = () => {
      setCurrentLogs(getLogs());
      setLastUpdated(new Date());
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('vdl-logs-updated', handleLogUpdate);

    // Auto-refresh polling mechanism for continuous monitoring
    let pollInterval;
    if (autoRefresh) {
      pollInterval = setInterval(() => {
        setCurrentLogs(getLogs());
        setLastUpdated(new Date());
      }, refreshInterval);
    }

    // Cleanup: Unsubscribe and clear interval when the component unmounts
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('vdl-logs-updated', handleLogUpdate);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [autoRefresh, refreshInterval]);

  const handleClearLogs = () => {
    clearLogs();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getFormattedTime = () => {
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', margin: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: 0 }}>API Logs</h2>
          <p style={{ fontSize: '0.85em', color: '#666', margin: '5px 0 0 0' }}>
            Last updated: <strong>{getFormattedTime()}</strong>
            <span style={{ marginLeft: '8px', display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: autoRefresh ? '#27ae60' : '#95a5a6' }}></span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Auto Refresh Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.95em', color: '#333' }}>Auto Refresh</span>
          </label>

          {/* Refresh Interval Selector */}
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              style={{
                padding: '6px 10px',
                border: '1px solid #bdc3c7',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              <option value={1000}>1 sec</option>
              <option value={2000}>2 sec</option>
              <option value={5000}>5 sec</option>
              <option value={10000}>10 sec</option>
            </select>
          )}

          {/* Clear Logs Button */}
          {currentLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              style={{
                backgroundColor: '#e74c3c',
                color: '#fff',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {currentLogs.length === 0 ? (
        <p style={{ color: '#777' }}>No API logs available yet.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {[...currentLogs].reverse().map((log, index) => {
            const logNumber = currentLogs.length - index;
            return (
              <li key={`${log.timestamp}-${index}`} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}>
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