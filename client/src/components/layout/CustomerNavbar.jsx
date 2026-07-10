import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModal } from '../../hooks/useAuthModal';
import NotificationBell from '../common/NotificationBell';

function CustomerNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const { getCartCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();
  const { openLogin } = useAuthModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const cartCount = getCartCount();
  const isCustomer = user?.role === 'customer';
  const homePath = isCustomer ? '/customer/dashboard' : '/';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || '');
  }, [location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();

    navigate(query ? `/restaurants?search=${encodeURIComponent(query)}` : '/restaurants');
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur">
      <nav
        aria-label="Customer navigation"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6"
      >
        <Link
          className="order-1 text-2xl font-black text-[#FF4F2E]"
          to={homePath}
        >
          FoodHub
        </Link>

        <form
          className="order-3 flex w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 focus-within:border-[#FF4F2E] md:order-2 md:mx-auto md:max-w-xl md:flex-1"
          onSubmit={handleSearch}
          role="search"
        >
          <input
            aria-label="Search restaurants or food"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search restaurants or food..."
            value={searchTerm}
          />
          <button
            aria-label="Search"
            className="inline-flex w-11 items-center justify-center text-lg text-[#FF4F2E] hover:bg-stone-100"
            type="submit"
          >
            <span aria-hidden="true">🔍</span>
          </button>
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <Link
            aria-label="Open cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-xl hover:bg-stone-50"
            to="/cart"
          >
            <span aria-hidden="true">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4F2E] px-1.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                aria-expanded={isProfileOpen}
                aria-label="Open profile menu"
                className="inline-flex h-10 items-center gap-1 rounded-md border border-stone-200 bg-white px-2 text-xl hover:bg-stone-50"
                onClick={() => setIsProfileOpen((current) => !current)}
                type="button"
              >
                <span aria-hidden="true">👤</span>
                <span aria-hidden="true" className="text-xs text-[#FF4F2E]">
                  ▾
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-2 shadow-xl">
                  {isCustomer ? (
                    <>
                      <Link
                        className="block px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
                        onClick={() => setIsProfileOpen(false)}
                        to="/customer/account"
                      >
                        Account
                      </Link>
                      <Link
                        className="block px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
                        onClick={() => setIsProfileOpen(false)}
                        to="/my-orders"
                      >
                        Orders
                      </Link>
                    </>
                  ) : (
                    <Link
                      className="block px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
                      onClick={() => setIsProfileOpen(false)}
                      to={`/${user.role === 'restaurant_owner' ? 'restaurant' : user.role}/dashboard`}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    className="block w-full border-t border-stone-200 px-4 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="rounded-md bg-[#FF4F2E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#E63E22]"
              onClick={openLogin}
              type="button"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default CustomerNavbar;
