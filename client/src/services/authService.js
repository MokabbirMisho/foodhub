import api from './api';

export const registerUser = async (formData) => {
  const response = await api.post('/auth/register', formData);
  return response.data;
};

export const loginUser = async (formData) => {
  const response = await api.post('/auth/login', formData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateMyAccount = async (data) => {
  const response = await api.patch('/auth/me', data);
  return response.data;
};

export const changeMyPassword = async (data) => {
  const response = await api.patch('/auth/change-password', data);
  return response.data;
};

export const googleLogin = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

export const googleSignUp = async (credential) => {
  const response = await api.post('/auth/google/signup', { credential });
  return response.data;
};

export const googleSignIn = async (credential) => {
  const response = await api.post('/auth/google/signin', { credential });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('foodhub_token');
  localStorage.removeItem('foodhub_user');
};
