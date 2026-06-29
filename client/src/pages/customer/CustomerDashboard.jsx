import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

function CustomerDashboard() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white/95 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Customer Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="mt-3 text-slate-700">Role: {user?.role}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/my-orders"
          >
            My Orders
          </Link>
          <Link
            className="rounded-md border border-orange-200 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
            to="/cart"
          >
            Cart ({getCartCount()})
          </Link>
          <Link
            className="rounded-md border border-orange-200 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

export default CustomerDashboard;
