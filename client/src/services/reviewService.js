import api from './api';

export const createReview = async (data) => {
  const response = await api.post('/reviews', data);
  return response.data;
};

export const getRestaurantReviews = async (restaurantId, params) => {
  const response = await api.get(`/reviews/restaurant/${restaurantId}`, { params });
  return response.data;
};

export const getMyReviews = async () => {
  const response = await api.get('/reviews/my-reviews');
  return response.data;
};

export const updateMyReview = async (reviewId, data) => {
  const response = await api.patch(`/reviews/${reviewId}`, data);
  return response.data;
};

export const deleteMyReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export const getAllReviewsForAdmin = async (params) => {
  const response = await api.get('/reviews/admin/all', { params });
  return response.data;
};

export const getMyRestaurantReviews = async (params) => {
  const response = await api.get('/reviews/owner/my-restaurant', { params });
  return response.data;
};

export const replyToReview = async (reviewId, message) => {
  const response = await api.patch(`/reviews/owner/${reviewId}/reply`, {
    message,
  });
  return response.data;
};

export const deleteOwnerReply = async (reviewId) => {
  const response = await api.delete(`/reviews/owner/${reviewId}/reply`);
  return response.data;
};
