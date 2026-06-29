import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

const quickActions = [
  {
    description: 'Discover approved restaurants and explore their available menus.',
    label: 'Browse Restaurants',
    to: '/restaurants',
  },
  {
    description: 'Review your selected meals and continue to checkout.',
    label: 'Cart',
    to: '/cart',
  },
  {
    description: 'Follow active orders and revisit your order history.',
    label: 'My Orders',
    to: '/my-orders',
  },
];

function CustomerDashboard() {
  const { getCartCount } = useCart();
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton />

        <header className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Customer Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold">Welcome, {user?.name}</h1>
          <p className="mt-3 text-slate-700">
            Browse restaurants, manage your cart, and keep track of your orders.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          {quickActions.map((action) => (
            <article className="rounded-xl bg-white p-6 shadow-sm" key={action.to}>
              <h2 className="text-xl font-bold">
                {action.label}
                {action.to === '/cart' && getCartCount() > 0
                  ? ` (${getCartCount()})`
                  : ''}
              </h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
              <Link
                className="mt-5 inline-flex rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                to={action.to}
              >
                Open
              </Link>
            </article>
          ))}
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Profile and Account
          </p>
          <h2 className="mt-2 text-2xl font-bold">{user?.name}</h2>
          <p className="mt-1 text-slate-600">{user?.email}</p>
          <p className="mt-5 rounded-lg bg-orange-50 p-4 text-slate-700">
            Profile management coming soon.
          </p>
        </section>
      </section>
    </main>
  );
}

export default CustomerDashboard;
