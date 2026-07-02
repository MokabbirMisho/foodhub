import api from './api';

export const getMyProfile = async () => {
  const response = await api.get('/customer/profile');
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await api.patch('/customer/profile', data);
  return response.data;
};

export const changeMyPassword = async (data) => {
  const response = await api.patch('/customer/change-password', data);
  return response.data;
};

export const getMyAddresses = async () => {
  const response = await api.get('/customer/addresses');
  return response.data;
};

export const addMyAddress = async (data) => {
  const response = await api.post('/customer/addresses', data);
  return response.data;
};

export const updateMyAddress = async (addressId, data) => {
  const response = await api.patch(`/customer/addresses/${addressId}`, data);
  return response.data;
};

export const deleteMyAddress = async (addressId) => {
  const response = await api.delete(`/customer/addresses/${addressId}`);
  return response.data;
};

export const setDefaultAddress = async (addressId) => {
  const response = await api.patch(
    `/customer/addresses/${addressId}/default`,
  );
  return response.data;
};
