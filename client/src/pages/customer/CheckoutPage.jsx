import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import {
  geocodeAddress,
  reverseGeocodeLocation,
} from '../../services/geocodeService';
import {
  addMyAddress,
  getMyAddresses,
} from '../../services/customerProfileService';
import { createOrder } from '../../services/orderService';

const DeliveryMap = lazy(() => import('../../components/map/DeliveryMap'));

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [savedAddressMessage, setSavedAddressMessage] = useState('');
  const [addressSaveWarning, setAddressSaveWarning] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isFindingLocation, setIsFindingLocation] = useState(false);
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

  const applySavedAddress = (address) => {
    setDeliveryAddress((current) => ({
      ...current,
      fullName: address.fullName || current.fullName || user?.name || '',
      phone: address.phone || current.phone,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country || 'Germany',
    }));
    setDeliveryLocation(
      Number.isFinite(address.location?.lat) &&
        Number.isFinite(address.location?.lng)
        ? address.location
        : null,
    );
    setSavedAddressMessage('Saved address applied');
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      return;
    }

    const loadSavedAddresses = async () => {
      try {
        const response = await getMyAddresses();
        const nextAddresses = response.data.addresses || [];
        setSavedAddresses(nextAddresses);

        const defaultAddress = nextAddresses.find(
          (address) => address.isDefault,
        );
        const addressFormIsEmpty =
          !deliveryAddress.street &&
          !deliveryAddress.city &&
          !deliveryAddress.postalCode;

        if (defaultAddress && addressFormIsEmpty) {
          setSelectedAddressId(defaultAddress._id);
          applySavedAddress(defaultAddress);
        }
      } catch (requestError) {
        setAddressSaveWarning('Saved addresses could not be loaded.');
      }
    };

    loadSavedAddresses();
  }, [isAuthenticated, user?.id, user?._id]);

  const handleAddressChange = (event) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [event.target.name]: event.target.value,
    });
  };

  const handleSavedAddressChange = (event) => {
    const addressId = event.target.value;
    setSelectedAddressId(addressId);
    setSavedAddressMessage('');

    const address = savedAddresses.find((item) => item._id === addressId);

    if (address) {
      applySavedAddress(address);
    }
  };

  const handleDemoCardChange = (event) => {
    setDemoCard({
      ...demoCard,
      [event.target.name]: event.target.value,
    });
  };

  const handleUseCurrentLocation = () => {
    setLocationMessage('');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.');
      return;
    }

    setIsFindingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const location = {
          lat: coords.latitude,
          lng: coords.longitude,
          displayName: 'Current location',
        };

        // Save coordinates first so a failed address lookup never loses the map pin.
        setDeliveryLocation(location);

        try {
          const response = await reverseGeocodeLocation({
            lat: location.lat,
            lng: location.lng,
          });
          const address = response.data;

          setDeliveryAddress((currentAddress) => ({
            ...currentAddress,
            street: address.street || currentAddress.street,
            city: address.city || currentAddress.city,
            postalCode: address.postalCode || currentAddress.postalCode,
            country: address.country || currentAddress.country,
          }));
          setDeliveryLocation({
            ...location,
            displayName: address.displayName || location.displayName,
          });
          setLocationMessage(
            'Current location added and address filled automatically.',
          );
        } catch (requestError) {
          setLocationError(
            'Location added, but address could not be filled automatically. Please enter address manually.',
          );
        } finally {
          setIsFindingLocation(false);
        }
      },
      (geolocationError) => {
        setIsFindingLocation(false);
        setLocationError(
          geolocationError.code === geolocationError.PERMISSION_DENIED
            ? 'Location permission denied. You can still place the order with address only.'
            : 'Could not get your current location. You can still use your written address.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleFindAddressLocation = async () => {
    try {
      setLocationMessage('');
      setLocationError('');
      setIsFindingLocation(true);
      const response = await geocodeAddress({
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        postalCode: deliveryAddress.postalCode,
        country: deliveryAddress.country,
      });

      setDeliveryLocation(response.data);
      setLocationMessage('Location found from address');
    } catch (requestError) {
      setLocationError(
        'Could not find location from address. Please check your address or use current location.',
      );
    } finally {
      setIsFindingLocation(false);
    }
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

      if (saveAddress) {
        try {
          await addMyAddress({
            label: addressLabel.trim() || 'Home',
            ...deliveryAddress,
            location: deliveryLocation,
            isDefault: savedAddresses.length === 0,
          });
        } catch (requestError) {
          // Saving is optional and must never prevent the order itself.
          setAddressSaveWarning(
            'Your order can continue, but this address could not be saved.',
          );
        }
      }

      await createOrder({
        restaurantId: restaurant._id,
        items: cartItems.map((item) => ({
          foodItemId: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        deliveryLocation,
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
        <section className="mx-auto max-w-3xl space-y-6">
          <BackButton />
          <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Your cart is empty.</h1>
          <Link
            className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl space-y-6">
          <BackButton fallbackPath="/" />
          <div className="rounded-xl bg-white p-6 shadow-sm">
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
          </div>
        </section>
      </main>
    );
  }

  if (user?.role !== 'customer') {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
        <section className="mx-auto max-w-3xl space-y-6">
          <BackButton />
          <div className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Only customers can place orders.</h1>
          <Link
            className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <BackButton />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
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

          {savedAddresses.length > 0 && (
            <section className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Choose saved address
                </span>
                <select
                  className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-orange-500"
                  onChange={handleSavedAddressChange}
                  value={selectedAddressId}
                >
                  <option value="">Select an address</option>
                  {savedAddresses.map((address) => (
                    <option key={address._id} value={address._id}>
                      {address.label} - {address.street}, {address.city}
                    </option>
                  ))}
                </select>
              </label>
              {savedAddressMessage && (
                <p className="mt-2 text-sm font-semibold text-green-700">
                  {savedAddressMessage}
                </p>
              )}
            </section>
          )}

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Order note</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
              onChange={(event) => setOrderNote(event.target.value)}
              value={orderNote}
            />
          </label>

          <section className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
            <h2 className="text-xl font-bold">Delivery Map Location</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a map location so the rider can find you more easily.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
                disabled={isFindingLocation}
                onClick={handleUseCurrentLocation}
                type="button"
              >
                Use my current location
              </button>
              <button
                className="rounded-md border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:text-orange-300"
                disabled={isFindingLocation}
                onClick={handleFindAddressLocation}
                type="button"
              >
                Find location from address
              </button>
            </div>

            {isFindingLocation && (
              <p className="mt-3 text-sm text-slate-600">Finding location...</p>
            )}
            {locationMessage && (
              <p className="mt-3 text-sm font-semibold text-green-700">
                {locationMessage}
              </p>
            )}
            {locationError && (
              <p className="mt-3 text-sm text-red-700">{locationError}</p>
            )}

            {deliveryLocation ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Map location added.</span>{' '}
                  {deliveryLocation.displayName}
                </p>
                <Suspense
                  fallback={
                    <p className="text-sm text-slate-600">Loading map preview...</p>
                  }
                >
                  <DeliveryMap
                    deliveryLocation={deliveryLocation}
                    height="240px"
                  />
                </Suspense>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No map location added yet. Rider will still see your written
                address.
              </p>
            )}
          </section>

          <section className="mt-5 rounded-xl border border-orange-100 bg-white p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={saveAddress}
                className="accent-orange-600"
                onChange={(event) => setSaveAddress(event.target.checked)}
                type="checkbox"
              />
              Save this address for future orders
            </label>
            {saveAddress && (
              <label className="mt-3 block">
                <span className="text-sm font-medium text-slate-700">
                  Address label
                </span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  onChange={(event) => setAddressLabel(event.target.value)}
                  placeholder="Home / Work"
                  value={addressLabel}
                />
              </label>
            )}
            {addressSaveWarning && (
              <p className="mt-3 text-sm text-orange-700">
                {addressSaveWarning}
              </p>
            )}
          </section>

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
        </div>
      </section>
    </main>
  );
}

export default CheckoutPage;
