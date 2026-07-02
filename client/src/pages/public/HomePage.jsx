import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import heroBg from '../../assets/images/foodhub-hero-bg.png';
import AuthCard from '../../components/common/AuthCard';
import { useAuth } from '../../hooks/useAuth';
import { getRestaurants } from '../../services/restaurantService';
import { getDashboardPath } from '../../utils/getDashboardPath';

const categories = [
  'Pizza',
  'Burger',
  'Biryani',
  'Sushi',
  'Pasta',
  'Desserts',
  'Drinks',
];

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const loadFeaturedRestaurants = async () => {
      try {
        const response = await getRestaurants();
        setRestaurants((response.data.restaurants || []).slice(0, 4));
      } catch (error) {
        setRestaurants([]);
      }
    };

    loadFeaturedRestaurants();
  }, []);

  return (
    <main className="min-h-screen bg-foodhub-cream text-foodhub-charcoal">
      <section
        className="relative min-h-[88vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-300">
              FoodHub
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight sm:text-6xl">
              Your favorite food, delivered fast
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-100">
              Discover local restaurants, order in minutes, and follow every
              step from kitchen to doorstep.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="fh-btn-primary" to="/restaurants">
                Browse Restaurants
              </Link>
              {isAuthenticated && (
                <Link
                  className="fh-btn-secondary border-white/70 bg-white/95"
                  to={dashboardPath}
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          </div>

          {isAuthenticated ? (
            <div className="border-l-4 border-orange-400 pl-5 text-white">
              <p className="text-sm font-semibold text-orange-200">
                Welcome back
              </p>
              <p className="mt-1 text-2xl font-bold">{user?.name}</p>
              <Link
                className="mt-5 inline-flex font-semibold text-white underline decoration-orange-300 underline-offset-4"
                to={dashboardPath}
              >
                Continue ordering
              </Link>
            </div>
          ) : (
            <AuthCard />
          )}
        </div>
      </section>

      <section className="border-b border-orange-100 bg-white py-6">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 pb-1 sm:px-8">
          {categories.map((category) => (
            <Link
              className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-orange-500 hover:text-orange-700"
              key={category}
              to={`/restaurants?search=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="fh-eyebrow">Local favorites</p>
              <h2 className="fh-section-title mt-2">Featured restaurants</h2>
            </div>
            <Link className="font-semibold text-orange-700" to="/restaurants">
              View all
            </Link>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(restaurants.length ? restaurants : [null, null, null, null]).map(
              (restaurant, index) =>
                restaurant ? (
                  <Link
                    className="fh-card fh-card-hover overflow-hidden"
                    key={restaurant._id}
                    to={`/restaurants/${restaurant._id}`}
                  >
                    {restaurant.coverImage || restaurant.logo ? (
                      <img
                        alt={restaurant.name}
                        className="h-40 w-full object-cover"
                        src={restaurant.coverImage || restaurant.logo}
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-orange-100 font-semibold text-orange-700">
                        FoodHub Restaurant
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-bold">{restaurant.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {restaurant.cuisineTypes?.join(', ') ||
                          restaurant.address?.city ||
                          'Local restaurant'}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div
                    className="fh-card h-60 animate-pulse bg-white"
                    key={`restaurant-placeholder-${index}`}
                  />
                ),
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="fh-eyebrow text-center">Simple from start to finish</p>
          <h2 className="fh-section-title mt-2 text-center">How FoodHub works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ['01', 'Choose a restaurant', 'Browse approved local partners and their available menus.'],
              ['02', 'Place your order', 'Choose delivery details and pay by cash or demo online payment.'],
              ['03', 'Track delivery', 'Follow order status and rider location from your account.'],
            ].map(([number, title, description]) => (
              <article className="border-t-2 border-orange-200 pt-5" key={number}>
                <p className="text-sm font-black text-orange-600">{number}</p>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-5 py-14 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-300">
              Ready to order?
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Your next meal is a few clicks away.
            </h2>
          </div>
          <Link className="fh-btn-primary w-fit" to="/restaurants">
            Browse Restaurants
          </Link>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
