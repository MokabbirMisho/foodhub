import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

const getNavLinkClasses = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-orange-100 text-orange-800'
      : 'text-slate-700 hover:bg-orange-50 hover:text-orange-700'
  }`;

function CustomerNavbar() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const cartCount = getCartCount();
  const isCustomer = user?.role === 'customer';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Customer navigation"
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      >
        <Link className="text-2xl font-black text-orange-600" to="/">
          FoodHub
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-1 border-t border-orange-100 pt-3 sm:order-2 sm:w-auto sm:border-0 sm:pt-0">
          <NavLink className={getNavLinkClasses} to="/restaurants">
            Browse Restaurants
          </NavLink>
          <NavLink className={getNavLinkClasses} to="/cart">
            <span className="inline-flex items-center gap-2">
              Cart
              {cartCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </span>
          </NavLink>
          {isCustomer && (
            <>
              <NavLink className={getNavLinkClasses} to="/my-orders">
                My Orders
              </NavLink>
              <NavLink className={getNavLinkClasses} to="/customer/dashboard">
                Profile
              </NavLink>
            </>
          )}
        </div>

        <div className="order-2 sm:order-3">
          {isAuthenticated ? (
            <button
              className="rounded-md border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          ) : (
            <Link
              className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              to="/"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default CustomerNavbar;
