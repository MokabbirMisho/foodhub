import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  return (
    <main className="fh-page flex items-center">
      <section className="fh-card mx-auto w-full max-w-xl p-10 text-center">
        <p className="fh-eyebrow">Access restricted</p>
        <h1 className="mt-2 text-3xl font-black">Unauthorized</h1>
        <p className="mt-3 text-slate-700">
          You do not have permission to view this page.
        </p>
        <Link className="fh-btn-primary mt-6" to="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}

export default UnauthorizedPage;
