import api from './api';

export const getAdminOverviewAnalytics = async (period = '30d') => {
  const response = await api.get('/admin/overview', { params: { period } });
  return response.data;
};
