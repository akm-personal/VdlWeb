import { logApiCall } from '../utils/logs';

const BASE_URL = 'https://scaling-happiness-q7r4xgwvq669h4p7r-5000.app.github.dev/api';

export const apiClient = async (endpoint, options = {}) => {
  // Fallback support for multiple keys if your auth stores them differently
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  const headers = {
    'Accept': 'text/plain',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Automatically Log outgoing request
  logApiCall('INFO', `Request: ${method} ${url}`, {
    method,
    headers: { ...headers, Authorization: token ? 'Bearer [HIDDEN]' : undefined },
    body: options.body ? JSON.parse(options.body) : undefined
  });

  try {
    const response = await fetch(url, { ...options, headers });

    // Global 401 Unauthorized Handler
    if (response.status === 401) {
      logApiCall('ERROR', `Response: ${method} ${url} - 401 Unauthorized`);
      alert('Your session has expired or token is invalid. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt_token');
      window.location.href = '/auth/login';
      throw new Error('Unauthorized session.');
    }

    const contentType = response.headers.get("content-type");
    const data = contentType && contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.message || data?.detail || data?.title || `Request failed with status ${response.status}`;
      logApiCall('ERROR', `Response: ${method} ${url} - ${response.status}`, { error: data });
      throw new Error(errorMessage);
    }

    // 2. Automatically Log successful response
    logApiCall('INFO', `Response: ${method} ${url} - 200 OK`, { responseData: data });
    
    return data;
  } catch (error) {
    // 3. Automatically Log exceptions
    logApiCall('ERROR', `API Request Failed: ${endpoint}`, { error: error.message || error });
    throw error;
  }
};

// Specific API functions
export const updateStudent = async (vdlId, studentData) => {
  return apiClient(`/Student/${vdlId}`, {
    method: 'PUT',
    body: JSON.stringify(studentData)
  });
};

export default apiClient;