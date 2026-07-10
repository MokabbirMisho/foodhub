import api from './api';

export const getAllUsersForAdmin = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const getUserByIdForAdmin = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminRiderDetails = async (riderId) => {
  const response = await api.get(`/admin/users/riders/${riderId}/details`);
  return response.data;
};

export const toggleUserBlockStatus = async (userId, isBlocked) => {
  const response = await api.patch(`/admin/users/${userId}/block`, {
    isBlocked,
  });
  return response.data;
};
