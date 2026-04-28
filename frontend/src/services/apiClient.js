import axios from 'axios';

const RAILWAY_URL = 'https://progressreport-production.up.railway.app/api';
const LOCAL_URL = `http://${window.location.hostname}:5000/api`;

// Always use Railway — it has the webhook data and full backend
const baseURL = RAILWAY_URL;

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;