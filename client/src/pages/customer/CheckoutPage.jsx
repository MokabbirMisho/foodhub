import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { createOrder } from '../../services/orderService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [demoCard, setDemoCard] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });
  const [error, setError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddressChange = (event) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [event.target.name]: event.target.value,
    });
  };

  const handleDemoCardChange = (event) => {
    setDemoCard({
      ...demoCard,
      [event.target.name]: event.target.value,
    });
  };

  const validateDemoCard = () => {
    const cardDigits = demoCard.cardNumber.replace(/\D/g, '');
    const cvcDigits = demoCard.cvc.replace(/\D/g, '');

    if (!demoCard.cardholderName.trim()) {
      return 'Cardholder name is required';
    }

    if (cardDigits.length < 12) {
      return 'Card number must contain at least 12 digits';
    }

    if (!demoCard.expiryDate.trim()) {
      return 'Expiry date is required';
    }

    if (cvcDigits.length < 3) {
      return 'CVC must contain at least 3 digits';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setPaymentMessage('');

    if (!isAuthenticated) {
      setError('Please login to place your order.');
      setTimeout(() => navigate('/'), 1200);
      return;
    }

    if (user?.role !== 'customer') {
      setError('Only customers can place orders.');
      return;
    }

    if (paymentMethod === 'demo_online') {
      const validationMessage = validateDemoCard();

      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (paymentMethod === 'demo_online') {
        setIsProcessingPayment(true);
        await wait(1000);
        setIsProcessingPayment(false);
        setPaymentMessage('Demo payment successful');
        await wait(600);
      }

      await createOrder({
        restaurantId: restaurant._id,
        items: cartItems.map((item) => ({
          foodItemId: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        orderNote,
        paymentMethod,
      });

      clearCart();
      navigate('/orders/success', {
        state: {
          paymentMethod,
          paymentStatus: paymentMethod === 'demo_online' ? 'paid' : 'unpaid',
        },
      });
    } catch (error) {
      setPaymentMessage('');
      setError(error.message);
    } finally {
      setIsProcessingPayment(false);
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

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-700">
              Payment method
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
                <input
                  checked={paymentMethod === 'cash_on_delivery'}
                  className="mt-1 accent-orange-600"
                  name="paymentMethod"
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  type="radio"
                />
                <span>
                  <span className="block font-semibold">Cash on Delivery</span>
                  <span className="text-sm text-slate-600">
                    Pay when your order arrives.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
                <input
                  checked={paymentMethod === 'demo_online'}
                  className="mt-1 accent-orange-600"
                  name="paymentMethod"
                  onChange={() => setPaymentMethod('demo_online')}
                  type="radio"
                />
                <span>
                  <span className="block font-semibold">Demo Online Payment</span>
                  <span className="text-sm font-medium text-orange-700">
                    Demo payment only
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          {paymentMethod === 'demo_online' && (
            <section className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5">
              <h2 className="text-lg font-bold">Demo card details</h2>
              <p className="mt-1 text-sm text-slate-600">
                This is a demo payment. No real money will be charged.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Cardholder Name
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-orange-500"
                    name="cardholderName"
                    onChange={handleDemoCardChange}
                    placeholder="Demo Customer"
                    value={demoCard.cardholderName}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Card Number
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-orange-500"
                    inputMode="numeric"
                    name="cardNumber"
                    onChange={handleDemoCardChange}
                    placeholder="4242 4242 4242 4242"
                    value={demoCard.cardNumber}
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-700">
                    Expiry Date
                  </span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-orange-500"
                    name="expiryDate"
                    onChange={handleDemoCardChange}
                    placeholder="12/34"
                    value={demoCard.expiryDate}
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-slate-700">CVC</span>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-orange-500"
                    inputMode="numeric"
                    name="cvc"
                    onChange={handleDemoCardChange}
                    placeholder="123"
                    value={demoCard.cvc}
                  />
                </label>
              </div>
            </section>
          )}

          {paymentMessage && (
            <p className="mt-5 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              {paymentMessage}
            </p>
          )}

          <button
            className="mt-6 rounded-md bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isProcessingPayment
              ? 'Processing demo payment...'
              : isSubmitting
                ? 'Placing order...'
                : paymentMethod === 'demo_online'
                  ? 'Pay Demo'
                  : 'Place Order'}
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
