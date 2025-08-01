import axios from 'axios';

// API URL configuration
// For development: use local IP for real device testing, localhost for simulator
// For production: use your deployed backend URL
const getApiUrl = () => {
  if (__DEV__) {
    // In development, use local IP for real devices, localhost for simulator
    return 'http://192.168.1.190:5001';
  }
  // In production, use your deployed backend URL
  return 'https://irhisdemo-production.up.railway.app';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// We will move the interceptors to AuthContext to avoid race conditions
// and to handle token refresh logic in a centralized place.

export default api; 