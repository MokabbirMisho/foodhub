import api from './api';

export const createFoodItem = async (data) => {
  const response = await api.post('/foods', data);
  return response.data;
};

export const getMyRestaurantFoodItems = async (params) => {
  const response = await api.get('/foods/my-restaurant', { params });
  return response.data;
};

export const getPublicRestaurantFoodItems = async (restaurantId, params) => {
  const response = await api.get(`/foods/restaurant/${restaurantId}`, { params });
  return response.data;
};

export const getFoodItemById = async (id) => {
  const response = await api.get(`/foods/${id}`);
  return response.data;
};

export const updateFoodItem = async (id, data) => {
  const response = await api.patch(`/foods/${id}`, data);
  return response.data;
};

export const deleteFoodItem = async (id) => {
  const response = await api.delete(`/foods/${id}`);
  return response.data;
};

export const toggleFoodAvailability = async (id) => {
  const response = await api.patch(`/foods/${id}/availability`);
  return response.data;
};

