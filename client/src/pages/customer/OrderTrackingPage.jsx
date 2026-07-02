import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import DeliveryMap from '../../components/map/DeliveryMap';
import { getOrderTracking } from '../../services/orderService';

const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

const formatAddress = (address) => {
  if (!address) {
    return 'Address not available';
  }

  return [
    address.fullName,
    address.street,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
};

function OrderTrackingPage() {
  const { id } = useParams();
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTracking = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getOrderTracking(id);
      setTracking(response.data.tracking);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton fallbackPath="/my-orders" />
          <button
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
            disabled={isLoading}
            onClick={loadTracking}
            type="button"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Location'}
          </button>
        </div>

        {isLoading && !tracking && (
          <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
            Loading order tracking...
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {tracking && (
          <>
            <header className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                Order #{String(tracking.orderId).slice(-8)}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold">Delivery Tracking</h1>
                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {tracking.status}
                </span>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-xl bg-white p-4 shadow-sm">
                <DeliveryMap
                  deliveryLocation={tracking.deliveryLocation}
                  riderLocation={tracking.riderLocation}
                />
                {!tracking.riderLocation && (
                  <p className="mt-3 text-sm text-slate-600">
                    Rider location is not available yet. Please check again later.
                  </p>
                )}
                {!tracking.deliveryLocation && (
                  <p className="mt-3 text-sm text-slate-600">
                    Delivery map location was not provided. Showing written
                    address only.
                  </p>
                )}
                {tracking.riderLocation?.updatedAt && (
                  <p className="mt-3 text-sm text-slate-600">
                    Last updated:{' '}
                    {new Date(tracking.riderLocation.updatedAt).toLocaleString()}
                  </p>
                )}
              </section>

              <aside className="space-y-4">
                <section className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    Restaurant
                  </p>
                  <h2 className="mt-2 text-xl font-bold">
                    {tracking.restaurant?.name || 'Restaurant'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatAddress(tracking.restaurant?.address)}
                  </p>
                </section>

                {tracking.orderNote && (
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      Order Note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {tracking.orderNote}
                    </p>
                  </section>
                )}

                <section className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    Delivery Address
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {formatAddress(tracking.deliveryAddress)}
                  </p>
                </section>

                <section className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    Rider
                  </p>
                  {tracking.rider ? (
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {tracking.rider.name}
                      </p>
                      {tracking.rider.email && <p>{tracking.rider.email}</p>}
                      {tracking.rider.phone && <p>{tracking.rider.phone}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      A rider has not been assigned yet.
                    </p>
                  )}
                </section>

                <section className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    Payment
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {formatPaymentMethod(tracking.paymentMethod)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatPaymentStatus(tracking.paymentStatus)}
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default OrderTrackingPage;
