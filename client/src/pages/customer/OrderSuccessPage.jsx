import { Link, useLocation } from 'react-router-dom';

const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

function OrderSuccessPage() {
  const { state } = useLocation();

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Order placed
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Your order has been placed successfully.
        </h1>
        {state?.paymentMethod && (
          <p className="mt-4 text-slate-700">
            {formatPaymentMethod(state.paymentMethod)} · Payment{' '}
            {formatPaymentStatus(state.paymentStatus)}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/my-orders"
          >
            View My Orders
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-orange-50"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccessPage;
