import api from './api';

export const createRestaurant = async (data) => {
  const response = await api.post('/restaurants', data);
  return response.data;
};

export const getMyRestaurant = async () => {
  const response = await api.get('/restaurants/my-restaurant');
  return response.data;
};

export const updateMyRestaurant = async (data) => {
  const response = await api.patch('/restaurants/my-restaurant', data);
  return response.data;
};

export const updateMyRestaurantAvailability = async (data) => {
  const response = await api.patch(
    '/restaurants/my-restaurant/availability',
    data,
  );
  return response.data;
};

export const getRestaurants = async (params) => {
  const response = await api.get('/restaurants', { params });
  return response.data;
};

export const getRestaurantById = async (id) => {
  const response = await api.get(`/restaurants/${id}`);
  return response.data;
};
