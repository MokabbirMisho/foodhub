import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../hooks/useCart';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const getEffectivePrice = (item) => {
  if (item.discountPrice !== null && item.discountPrice !== undefined) {
    return Number(item.discountPrice);
  }

  return Number(item.price || 0);
};

function CartPage() {
  const {
    cartItems,
    clearCart,
    decreaseQuantity,
    getDeliveryFee,
    getSubtotal,
    getTotal,
    increaseQuantity,
    removeFromCart,
    restaurant,
  } = useCart();

  return (
    <main className="fh-page">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton />
        <header className="fh-card flex flex-col gap-4 p-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              FoodHub Cart
            </p>
            <h1 className="mt-2 text-4xl font-black">Your cart</h1>
            {restaurant && (
              <p className="mt-3 text-slate-700">Restaurant: {restaurant.name}</p>
            )}
          </div>

          <Link
            className="fh-btn-primary"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </header>

        {cartItems.length === 0 ? (
          <section className="fh-card p-10 text-center text-slate-700">
            <p className="text-5xl" aria-hidden="true">🛒</p>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Your cart is empty
            </h2>
            <p className="mt-2">Add something delicious from a local restaurant.</p>
            <Link
              className="fh-btn-primary mt-6"
              to="/restaurants"
            >
              Browse Restaurants
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              {cartItems.map((item) => (
                <article
                  className="fh-card flex flex-col gap-4 p-5 md:flex-row"
                  key={item._id}
                >
                  {item.image ? (
                    <img
                      alt={item.name}
                      className="h-28 w-full rounded-lg object-cover md:w-36"
                      src={item.image}
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-lg bg-orange-50 text-sm text-orange-700 md:w-36">
                      No image
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      {item.category}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">{item.name}</h2>
                    <p className="mt-2 text-slate-700">
                      Price: {formatCurrency(getEffectivePrice(item))}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        aria-label={`Decrease ${item.name} quantity`}
                        className="h-10 w-10 rounded-lg border border-slate-300 font-bold hover:border-orange-300 hover:bg-orange-50"
                        onClick={() => decreaseQuantity(item._id)}
                        type="button"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        aria-label={`Increase ${item.name} quantity`}
                        className="h-10 w-10 rounded-lg border border-slate-300 font-bold hover:border-orange-300 hover:bg-orange-50"
                        onClick={() => increaseQuantity(item._id)}
                        type="button"
                      >
                        +
                      </button>
                      <button
                        className="ml-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => removeFromCart(item._id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="fh-card sticky top-24 h-fit p-6">
              <h2 className="text-2xl font-bold">Summary</h2>
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

              <Link
                className="fh-btn-primary mt-6 w-full"
                to="/checkout"
              >
                Proceed to Checkout
              </Link>
              <button
                className="fh-btn-danger mt-3 w-full"
                onClick={clearCart}
                type="button"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default CartPage;
