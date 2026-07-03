import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/getDashboardPath';

const dashboardLabels = {
  customer: 'Go to Dashboard',
  restaurant_owner: 'Owner Dashboard',
  rider: 'Rider Dashboard',
  admin: 'Admin Dashboard',
};

function PublicNavbar({ onOpenAuth }) {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 shadow-sm backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link className="text-2xl font-black text-orange-600" to="/">
          FoodHub
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              to={getDashboardPath(user?.role)}
            >
              {dashboardLabels[user?.role] || 'Dashboard'}
            </Link>
            <button
              className="hidden min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 sm:inline-flex sm:items-center"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            onClick={onOpenAuth}
            type="button"
          >
            Sign in / Sign up
          </button>
        )}
      </nav>
    </header>
  );
}

export default PublicNavbar;
