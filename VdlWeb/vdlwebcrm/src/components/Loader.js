import React from 'react';

const Loader = ({ message = "Loading...", fullScreen = false }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    width: '100%',
    minHeight: fullScreen ? '100vh' : 'auto',
    backgroundColor: fullScreen ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
    position: fullScreen ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    zIndex: fullScreen ? 9999 : 1
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(52, 152, 219, 0.2)',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div style={containerStyle}>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <div style={spinnerStyle}></div>
      <p style={{ marginTop: '15px', color: '#3498db', fontWeight: 'bold', fontSize: '15px' }}>{message}</p>
    </div>
  );
};

export default Loader;