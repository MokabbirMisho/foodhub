import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="fh-page flex items-center">
      <section className="fh-card mx-auto w-full max-w-xl p-10 text-center">
        <p className="fh-eyebrow">404</p>
        <h1 className="mt-2 text-3xl font-black">Page not found</h1>
        <p className="mt-3 text-zinc-700">
          The page you are looking for does not exist.
        </p>
        <Link className="fh-btn-primary mt-6" to="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;
