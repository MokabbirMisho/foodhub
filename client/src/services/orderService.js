import api from './api';

export const createOrder = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/orders/my-orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const cancelMyOrder = async (id) => {
  const response = await api.patch(`/orders/${id}/cancel`);
  return response.data;
};

export const getMyRestaurantOrders = async (params) => {
  const response = await api.get('/orders/restaurant/my-orders', { params });
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data;
};

export const getAllOrdersForAdmin = async (params) => {
  const response = await api.get('/orders/admin/all', { params });
  return response.data;
};

export const getAvailableDeliveriesForRider = async () => {
  const response = await api.get('/orders/rider/available');
  return response.data;
};

export const getMyDeliveriesForRider = async (params) => {
  const response = await api.get('/orders/rider/my-deliveries', { params });
  return response.data;
};

export const acceptDelivery = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/accept-delivery`);
  return response.data;
};

export const markDeliveryAsDelivered = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/mark-delivered`);
  return response.data;
};
