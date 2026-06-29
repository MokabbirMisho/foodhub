import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { createOrder } from '../../services/orderService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const getEffectivePrice = (item) => {
  if (item.discountPrice !== null && item.discountPrice !== undefined) {
    return Number(item.discountPrice);
  }

  return Number(item.price || 0);
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    cartItems,
    clearCart,
    getDeliveryFee,
    getSubtotal,
    getTotal,
    restaurant,
  } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'Germany',
  });
  const [orderNote, setOrderNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddressChange = (event) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Please login to place your order.');
      setTimeout(() => navigate('/'), 1200);
      return;
    }

    if (user?.role !== 'customer') {
      setError('Only customers can place orders.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createOrder({
        restaurantId: restaurant._id,
        items: cartItems.map((item) => ({
          foodItemId: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        orderNote,
      });

      clearCart();
      navigate('/orders/success');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Your cart is empty.</h1>
          <Link
            className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Please login to place your order.</h1>
          <p className="mt-3 text-slate-700">
            Your cart is saved. Sign in from the landing page to continue checkout.
          </p>
          <Link
            className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/"
          >
            Go to Sign In
          </Link>
        </section>
      </main>
    );
  }

  if (user?.role !== 'customer') {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Only customers can place orders.</h1>
          <Link
            className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <form className="rounded-xl bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Checkout
          </p>
          <h1 className="mt-2 text-4xl font-bold">Delivery details</h1>

          {error && (
            <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['fullName', 'Full name'],
              ['phone', 'Phone'],
              ['street', 'Street'],
              ['city', 'City'],
              ['postalCode', 'Postal code'],
              ['country', 'Country'],
            ].map(([name, label]) => (
              <label className="block" key={name}>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  name={name}
                  onChange={handleAddressChange}
                  required
                  value={deliveryAddress[name]}
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Order note</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
              onChange={(event) => setOrderNote(event.target.value)}
              value={orderNote}
            />
          </label>

          <button
            className="mt-6 rounded-md bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Placing order...' : 'Place Order'}
          </button>
        </form>

        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Order summary</h2>
          <p className="mt-2 text-slate-700">{restaurant?.name}</p>

          <div className="mt-5 space-y-4">
            {cartItems.map((item) => (
              <div className="border-b border-slate-100 pb-3" key={item._id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(getEffectivePrice(item) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span>{formatCurrency(getDeliveryFee())}</span>
            </div>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default CheckoutPage;

