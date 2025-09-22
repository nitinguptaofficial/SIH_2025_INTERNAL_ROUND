import axios from 'axios';

// Update this URL to point to your backend server
// For local development, you might use your machine's IP address
// e.g., const API_BASE_URL = 'http://192.168.x.x:3000/api';
const API_BASE_URL = 'http://192.168.x.x:3000/api';

console.log('Using API URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
  timeout: 30000, // 30 second timeout
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Don't reject if status is not 2xx
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - no response received');
      console.error('Check if:');
      console.error('1. Backend server is running');
      console.error('2. Device and server are on same network');
      console.error('3. Server IP and port are correct');
      console.error('4. No firewall blocking the connection');
    } else {
      console.error(
        'Server error:',
        error.response.status,
        error.response.data,
      );
    }
    return Promise.reject(error);
  },
);

export default api;
