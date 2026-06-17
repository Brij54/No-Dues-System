import axios from 'axios';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    _env_?: {
      REACT_APP_API_URL?: string;
      REACT_APP_KEYCLOAK_CLIENT_ID?: string;
    };
  }
}

const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Prioritize fallback via hostname detection for robust staging/production behavior
    const hostname = window.location.hostname;
    if (hostname === 'nodues.staging.iiitb.net') {
      return 'https://noduesapi.staging.iiitb.net';
    }
    if (hostname === 'nodues.iiitb.net') {
      return 'https://noduesapi.iiitb.net';
    }

    // 2. Dynamic runtime environment variables from Docker/Nginx
    if (window._env_?.REACT_APP_API_URL) {
      return window._env_.REACT_APP_API_URL;
    }
  }
  // 3. Static build-time/development fallback
  return process.env.REACT_APP_API_URL || '';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Public endpoints that must never receive a Bearer token.
// Sending an expired token to these routes causes Spring Security's
// opaque-token introspector to return 401 even though they are permitAll().
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Request interceptor — attach JWT only for protected endpoints
api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ENDPOINTS.some((url) => config.url?.includes(url));
    if (!isPublic) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth pages where a 401 must NOT trigger a redirect to /login
const AUTH_PAGES = ['/login', '/forgot-password'];

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data || error.message;

    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      const onAuthPage = AUTH_PAGES.some((p) => window.location.pathname.startsWith(p));
      if (!onAuthPage) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status === 409) {
      toast.error(typeof message === 'string' ? message : 'Conflict: resource already exists.');
    } else if (status === 500) {
      const serverMsg = typeof message === 'string' ? message : null;
      toast.error(serverMsg || 'Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
