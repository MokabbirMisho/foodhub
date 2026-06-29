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
    if (error.response?.status === 401) {
      localStorage.removeItem('foodhub_token');
      localStorage.removeItem('foodhub_user');
    }

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    return Promise.reject(new Error(message));
  },
);

export default api;
