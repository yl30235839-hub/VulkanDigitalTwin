
import axios from 'axios';

// Create a customized axios instance
const api = axios.create({
  // Setting the baseURL to relative /api to support the local Express backend
  baseURL: '/api', 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mes_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Specialized handling for "Network Error" which occurs when the local server is unreachable
    if (error.message === 'Network Error') {
      console.error('MES API Network Error: The local server at https://localhost:7044 may be offline or CORS is not configured.');
    }
    
    if (error.response?.status === 401) {
      console.error('Session expired. Please log in again.');
    }
    
    if (error.response?.status === 403) {
      console.error('Permission denied.');
    }

    return Promise.reject(error);
  }
);

export default api;
