import axios from 'axios';

// home
const API_URL = 'https://demo-6g2p.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 