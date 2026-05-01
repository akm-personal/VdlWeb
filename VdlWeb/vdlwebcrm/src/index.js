import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import reportWebVitals from './reportWebVitals';
import { logApiCall } from './utils/logs';

// Global fetch interceptor for real-time API logging
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : (resource?.url || String(resource));
  const method = config?.method || 'GET';
  const startTime = Date.now();

  try {
    const response = await originalFetch(...args);
    const duration = Date.now() - startTime;
    
    // Clone the response so we can read it without consuming the original stream
    const clonedResponse = response.clone();
    clonedResponse.text().then(bodyText => {
      logApiCall(response.ok ? 'INFO' : 'WARNING', `${method} ${url}`, {
        status: response.status,
        duration: `${duration}ms`,
        response: bodyText.substring(0, 500) // Limiting body size in logs
      });
    }).catch(() => {
      logApiCall(response.ok ? 'INFO' : 'WARNING', `${method} ${url}`, { status: response.status, duration: `${duration}ms` });
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiCall('ERROR', `${method} ${url}`, {
      error: error.message || 'Network Error',
      duration: `${duration}ms`
    });
    throw error;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
