import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Attach the JWT to every outgoing request if we have one.
 * Reading from localStorage per-request (rather than at module load)
 * means a fresh login takes effect immediately, with no page reload.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalise errors so components can just read `error.message`. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
