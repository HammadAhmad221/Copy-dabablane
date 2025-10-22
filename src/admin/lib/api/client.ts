import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dev.dabablane.com/api';
const ADMIN_API_PATH = '';

// Main authenticated admin API client
export const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_API_PATH}`,
  timeout: 30000,
  headers: {
    'Accept': 'application/json'
  },
});

// Guest admin API client (no auth token)
export const adminGuestApiClient = axios.create({
  baseURL: `${API_BASE_URL}${ADMIN_API_PATH}`,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'X-Auth-Token': import.meta.env.VITE_API_TOKEN
  },
});

// Request interceptor to add auth token
adminApiClient.interceptors.request.use((config) => {
  // Use the hardcoded token for now (this should be replaced with proper auth later)
  const token = '666|4s6ttd05NEXXPesmwPw78cJdKHYFEVf2DNKpNSRl346a613d';
  
  // Set headers
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  // Accept JSON responses by default
  if (!config.headers.Accept) {
    config.headers.Accept = 'application/json';
  }

  // For FormData requests, let the browser/axios set the correct multipart boundary
  // Otherwise default to JSON when not explicitly provided
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    // Ensure we do NOT force JSON content type
    delete (config.headers as any)['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
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