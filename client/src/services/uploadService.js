import api from './api';

const uploadImage = async (url, file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(url, formData);
  return response.data;
};

export const uploadRestaurantLogo = async (file) => {
  return uploadImage('/uploads/restaurant-logo', file);
};

export const uploadRestaurantCover = async (file) => {
  return uploadImage('/uploads/restaurant-cover', file);
};

export const uploadFoodImage = async (file) => {
  return uploadImage('/uploads/food-image', file);
};
