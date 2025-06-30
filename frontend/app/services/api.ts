import axios from 'axios';

// home
const API_URL = 'http://192.168.1.95:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 