/**
 * A simple logging utility for API calls.
 * In a real-world application, this would integrate with a more robust logging solution
 * (e.g., sending logs to a remote server, writing to a file, using a dedicated logging library).
 */
let logs = [];
const LOG_STORAGE_KEY = 'api_logs';
let listeners = [];

// Load logs from sessionStorage on initialization
try {
  const storedLogs = sessionStorage.getItem(LOG_STORAGE_KEY);
  if (storedLogs) {
    logs = JSON.parse(storedLogs);
  }
} catch (e) {
  console.error("Failed to load logs from sessionStorage:", e);
  logs = []; // Fallback to empty array if parsing fails
}

const saveLogs = () => {
  try {
    sessionStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save logs to sessionStorage:", e);
  }
};

const notifyListeners = () => {
  listeners.forEach(listener => listener([...logs])); // Pass a copy
};

export const logApiCall = (level, message, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...details,
  };

  console.log(`[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.message}`, logEntry);
  logs.push(logEntry);
  saveLogs(); // Save after each new log
  notifyListeners(); // Notify listeners
};

// Function to retrieve logs
export const getLogs = () => {
  return logs;
};

// Function to subscribe to log updates
export const subscribeToLogs = (callback) => {
  listeners.push(callback);
  // Immediately provide current logs to new subscriber
  callback([...logs]); // Pass a copy
  return () => {
    // Return an unsubscribe function
    listeners = listeners.filter(listener => listener !== callback);
  };
};