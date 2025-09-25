import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
// Keep ADMIN_API_PATH empty since BACK_AUTH_ENDPOINTS already includes the /api prefix
const ADMIN_API_PATH = '';

// Main authenticated admin API client
export const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_API_PATH}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Auth-Token': import.meta.env.VITE_API_TOKEN
  },
});

// Guest admin API client (no auth token)
export const adminGuestApiClient = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_API_PATH}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Auth-Token': import.meta.env.VITE_API_TOKEN
  },
});

// Request interceptor to add auth token
adminApiClient.interceptors.request.use((config) => {
  // Update token on each request to ensure it's current
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling auth errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Use window.location instead of navigate since this is outside React component
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
); 