import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Add the JWT token to every request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodhub_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Return a clean error message and clear saved auth data if the token is invalid.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const responseMessage = error.response?.data?.message || '';
    const sessionMustEnd =
      status === 401 ||
      (status === 403 && responseMessage.toLowerCase().includes('blocked'));

    if (sessionMustEnd) {
      localStorage.removeItem('foodhub_token');
      localStorage.removeItem('foodhub_user');
      window.dispatchEvent(new Event('foodhub:auth-cleared'));
    }

    const message =
      responseMessage || error.message || 'Something went wrong';

    return Promise.reject(new Error(message));
  },
);

export default api;
