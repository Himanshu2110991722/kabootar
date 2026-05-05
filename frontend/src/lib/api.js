import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Render free tier cold-starts take up to 50 seconds.
// Android app needs a longer timeout than a browser tab.
const TIMEOUT = Capacitor.isNativePlatform() ? 60000 : 15000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: TIMEOUT,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kabootar_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kabootar_token');
      localStorage.removeItem('kabootar_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
