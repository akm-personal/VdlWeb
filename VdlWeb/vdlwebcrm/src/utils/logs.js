/**
 * A simple logging utility for API calls.
 * In a real-world application, this would integrate with a more robust logging solution
 * (e.g., sending logs to a remote server, writing to a file, using a dedicated logging library).
 */
let logs = [];
const LOG_STORAGE_KEY = 'api_logs';
let listeners = [];

// Load logs from localStorage on initialization so logs persist across refreshes
try {
  const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
  if (storedLogs) {
    logs = JSON.parse(storedLogs);
  }
} catch (e) {
  console.error("Failed to load logs from localStorage:", e);
  logs = []; // Fallback to empty array if parsing fails
}

const saveLogs = () => {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save logs to localStorage:", e);
  }
};

const notifyListeners = () => {
  const currentLogs = [...logs];
  listeners.forEach(listener => listener(currentLogs)); // Pass a copy
  // Notify any listeners in the same tab outside React components
  window.dispatchEvent(new Event('vdl-logs-updated'));
};

// Listen for log updates from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === LOG_STORAGE_KEY) {
    try {
      logs = e.newValue ? JSON.parse(e.newValue) : [];
      notifyListeners();
    } catch (err) {
      console.error("Failed to parse logs from storage event:", err);
    }
  }
});

export const logApiCall = (level, message, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...details,
  };

  console.log(`[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.message}`, logEntry);
  
  // Sync with latest localStorage to avoid overwriting logs from other tabs
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) logs = JSON.parse(stored);
  } catch (e) {}

  logs.push(logEntry);
  saveLogs(); // Save after each new log
  notifyListeners(); // Notify listeners
};

// Function to retrieve logs
export const getLogs = () => {
  try {
    const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
    if (storedLogs) {
      logs = JSON.parse(storedLogs);
    }
  } catch (e) {
    console.error("Failed to parse logs from localStorage:", e);
  }
  return [...logs];
};

// Function to subscribe to log updates
export const subscribeToLogs = (callback) => {
  listeners.push(callback);
  // Immediately provide current logs to new subscriber
  callback(getLogs()); // Pass a fresh copy from storage
  return () => {
    // Return an unsubscribe function
    listeners = listeners.filter(listener => listener !== callback);
  };
};

// Function to clear all logs
export const clearLogs = () => {
  logs = [];
  saveLogs();
  notifyListeners();
};