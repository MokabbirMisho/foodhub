import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CustomerNavbar from '../components/layout/CustomerNavbar';
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

const OrderTrackingPage = lazy(
  () => import('../pages/customer/OrderTrackingPage'),
);

function CustomerPageLayout({ children }) {
  return (
    <>
      <CustomerNavbar />
      {children}
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/restaurants"
        element={
          <CustomerPageLayout>
            <RestaurantsPage />
          </CustomerPageLayout>
        }
      />
      <Route
        path="/restaurants/:id"
        element={
          <CustomerPageLayout>
            <RestaurantDetailsPage />
          </CustomerPageLayout>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/cart"
        element={
          <CustomerPageLayout>
            <CartPage />
          </CustomerPageLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <CustomerPageLayout>
            <CheckoutPage />
          </CustomerPageLayout>
        }
      />
      <Route
        path="/orders/success"
        element={
          <CustomerPageLayout>
            <OrderSuccessPage />
          </CustomerPageLayout>
        }
      />

      <Route
        path="/my-orders"
        element={
          <CustomerPageLayout>
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <MyOrdersPage />
              </RoleRoute>
            </ProtectedRoute>
          </CustomerPageLayout>
        }
      />

      <Route
        path="/orders/:id/tracking"
        element={
          <CustomerPageLayout>
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <Suspense
                  fallback={
                    <p className="min-h-screen bg-orange-50 p-6 text-slate-700">
                      Loading tracking map...
                    </p>
                  }
                >
                  <OrderTrackingPage />
                </Suspense>
              </RoleRoute>
            </ProtectedRoute>
          </CustomerPageLayout>
        }
      />

      <Route
        path="/customer/dashboard"
        element={
          <CustomerPageLayout>
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          </CustomerPageLayout>
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
