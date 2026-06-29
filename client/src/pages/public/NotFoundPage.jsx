import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-orange-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-slate-700">
          The page you are looking for does not exist.
        </p>
        <Link className="mt-6 inline-block font-semibold text-orange-600" to="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;
