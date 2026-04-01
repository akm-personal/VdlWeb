import axios from 'axios';

const api = axios.create({
  baseURL: 'https://scaling-happiness-q7r4xgwvq669h4p7r-5000.app.github.dev/api', // Updated API Base URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token'); // Changed to 'jwt_token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
); 

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('jwt_token'); // Changed to 'jwt_token'
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export default api;
