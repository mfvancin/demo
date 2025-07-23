import axios from 'axios';

// Local development backend URL
const API_URL = 'http://localhost:5001';

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