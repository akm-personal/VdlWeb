import api from '../../services/apis';
import { logApiCall } from '../../utils/logs';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      logApiCall('info', 'Login API call successful', { endpoint: '/auth/login', request: credentials, response: response.data });
      return response.data;
    } catch (error) {
      logApiCall('error', 'Login API call failed', { endpoint: '/auth/login', request: credentials, error: error.message, response: error.response?.data });
      throw error; // Re-throw the error so the calling component can handle it
    }
  },

  logout: () => {
    // On client-side, logout typically involves clearing local storage.
    // If a backend logout endpoint is needed for token invalidation, it can be added here.
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    logApiCall('info', 'User logged out', { action: 'logout' });
  },

  // Example: You might have other auth-related API calls here
  register: async (userData) => {
    // Assuming a register endpoint exists
    try {
      const response = await api.post('/auth/register', userData);
      logApiCall('info', 'Register API call successful', { endpoint: '/auth/register', request: userData, response: response.data });
      return response.data;
    } catch (error) {
      logApiCall('error', 'Register API call failed', { endpoint: '/auth/register', request: userData, error: error.message, response: error.response?.data });
      throw error; // Re-throw the error so the calling component can handle it
    }
  },

  // Example: For fetching user details after token validation
  getCurrentUser: () => {
    // This would typically hit an endpoint that returns user details based on the JWT
    // For now, we'll assume it's not directly used by Login.js but might be elsewhere.
    // If your backend has a /auth/me endpoint, you can use it here.
    const user = JSON.parse(localStorage.getItem('user_info'));
    if (user) {
      logApiCall('info', 'Retrieved current user from local storage', { user: user.username });
    } else {
      logApiCall('warn', 'No current user found in local storage');
    }
    return user;
  },
};
