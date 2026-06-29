import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../context/CartContext';

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
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl space-y-6">
        <BackButton />
        <header className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              FoodHub Cart
            </p>
            <h1 className="mt-2 text-4xl font-bold">Your cart</h1>
            {restaurant && (
              <p className="mt-3 text-slate-700">Restaurant: {restaurant.name}</p>
            )}
          </div>

          <Link
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </header>

        {cartItems.length === 0 ? (
          <section className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
            <p>Your cart is empty.</p>
            <Link
              className="mt-5 inline-block rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
              to="/restaurants"
            >
              Browse Restaurants
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              {cartItems.map((item) => (
                <article
                  className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row"
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
                        className="h-9 w-9 rounded-md border border-slate-300 font-bold hover:bg-orange-50"
                        onClick={() => decreaseQuantity(item._id)}
                        type="button"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        className="h-9 w-9 rounded-md border border-slate-300 font-bold hover:bg-orange-50"
                        onClick={() => increaseQuantity(item._id)}
                        type="button"
                      >
                        +
                      </button>
                      <button
                        className="ml-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
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

            <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
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
                className="mt-6 block w-full rounded-md bg-orange-600 px-4 py-3 text-center font-semibold text-white hover:bg-orange-700"
                to="/checkout"
              >
                Proceed to Checkout
              </Link>
              <button
                className="mt-3 w-full rounded-md border border-red-200 px-4 py-3 font-semibold text-red-700 hover:bg-red-50"
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
