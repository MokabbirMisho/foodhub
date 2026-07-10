import { Link, useLocation } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';

const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

function OrderSuccessPage() {
  const { state } = useLocation();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
      <section className="mx-auto max-w-3xl">
        <BackButton />
        <div className="mt-6 rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
          Order placed
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Your order has been placed successfully.
        </h1>
        {state?.paymentMethod && (
          <p className="mt-4 text-zinc-700">
            {formatPaymentMethod(state.paymentMethod)} · Payment{' '}
            {formatPaymentStatus(state.paymentStatus)}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-md bg-[#FF4F2E] px-4 py-2 font-semibold text-white hover:bg-[#E63E22]"
            to="/my-orders"
          >
            View My Orders
          </Link>
          <Link
            className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </div>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccessPage;
