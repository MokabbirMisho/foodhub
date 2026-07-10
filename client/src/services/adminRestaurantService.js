import api from './api';

export const getAdminRestaurants = async (params) => {
  const response = await api.get('/restaurants/admin/all', { params });
  return response.data;
};

export const getAdminRestaurantDetails = async (id) => {
  const response = await api.get(`/restaurants/admin/${id}/details`);
  return response.data;
};

export const updateRestaurantForAdmin = async (id, data) => {
  const response = await api.patch(`/restaurants/admin/${id}`, data);
  return response.data;
};

export const approveRestaurant = async (id) => {
  const response = await api.patch(`/restaurants/${id}/approve`);
  return response.data;
};

export const rejectRestaurant = async (id) => {
  const response = await api.patch(`/restaurants/${id}/reject`);
  return response.data;
};
