import api from './api';

export const geocodeAddress = async (address) => {
  const response = await api.post('/geocode/address', address);
  return response.data;
};

export const reverseGeocodeLocation = async (location) => {
  const response = await api.post('/geocode/reverse', location);
  return response.data;
};
