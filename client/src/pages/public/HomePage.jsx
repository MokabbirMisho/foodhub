import { Link } from 'react-router-dom';
import AuthCard from '../../components/common/AuthCard';
import { useAuth } from '../../hooks/useAuth';
import heroBg from '../../assets/images/foodhub-hero-bg.png';
import { getDashboardPath } from '../../utils/getDashboardPath';

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);

  return (
    <main
      className="min-h-screen bg-cover bg-center px-6 py-8 text-white"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="min-h-[calc(100vh-4rem)] rounded-3xl bg-slate-950/35 px-4 py-8 shadow-2xl md:px-10">
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-orange-300">
              FoodHub
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Food delivery made simple
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-100">
              Order meals, manage your restaurant, or deliver with FoodHub from
              one platform.
            </p>

            {isAuthenticated && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="rounded-md bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
                  to={dashboardPath}
                >
                  Go to dashboard
                </Link>
                <Link
                  className="rounded-md bg-white/90 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
                  to="/restaurants"
                >
                  Browse Restaurants
                </Link>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-8">
                <Link
                  className="rounded-md bg-white/90 px-5 py-3 font-semibold text-slate-900 hover:bg-white"
                  to="/restaurants"
                >
                  Browse Restaurants
                </Link>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <Link
              className="rounded-2xl bg-white/95 p-6 text-center text-lg font-semibold text-slate-900 shadow-2xl"
              to={dashboardPath}
            >
              You are signed in. Continue to your dashboard.
            </Link>
          ) : (
            <AuthCard />
          )}
        </section>
      </div>
    </main>
  );
}

export default HomePage;
