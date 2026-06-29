export const getDashboardPath = (role) => {
  if (role === 'restaurant_owner') {
    return '/restaurant/dashboard';
  }

  if (role === 'rider') {
    return '/rider/dashboard';
  }

  if (role === 'admin') {
    return '/admin/dashboard';
  }

  return '/customer/dashboard';
};

