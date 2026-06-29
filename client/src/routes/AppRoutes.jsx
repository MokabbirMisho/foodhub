import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import MyOrdersPage from '../pages/customer/MyOrdersPage';
import OrderSuccessPage from '../pages/customer/OrderSuccessPage';
import HomePage from '../pages/public/HomePage';
import NotFoundPage from '../pages/public/NotFoundPage';
import RestaurantDetailsPage from '../pages/public/RestaurantDetailsPage';
import RestaurantsPage from '../pages/public/RestaurantsPage';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';
import RestaurantDashboard from '../pages/restaurant/RestaurantDashboard';
import RiderDashboard from '../pages/rider/RiderDashboard';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/restaurants" element={<RestaurantsPage />} />
      <Route path="/restaurants/:id" element={<RestaurantDetailsPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders/success" element={<OrderSuccessPage />} />

      <Route
        path="/my-orders"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <MyOrdersPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/restaurant/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['restaurant_owner']}>
              <RestaurantDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['rider']}>
              <RiderDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
