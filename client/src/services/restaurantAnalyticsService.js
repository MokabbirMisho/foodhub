import api from './api';

export const getMyRestaurantAnalytics = async (period = '30d') => {
  const response = await api.get('/restaurants/my-restaurant/analytics', {
    params: { period },
  });
  return response.data;
};
