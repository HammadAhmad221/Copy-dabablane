import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.dabablane.com';
const ADMIN_API_PATH = '/admin';

// Create axios instance with default config for admin endpoints
export const adminApi = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_API_PATH}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an auth token to requests
export const setAdminAuthToken = (token: string) => {
  if (token) {
    adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete adminApi.defaults.headers.common['Authorization'];
  }
}; 