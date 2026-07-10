import { Navigate, useSearchParams } from 'react-router-dom';
import AuthCard from '../../components/common/AuthCard';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/getDashboardPath';

const allowedPublicRoles = ['customer', 'restaurant_owner', 'rider'];

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const roleFromUrl = searchParams.get('role');
  const initialRole = allowedPublicRoles.includes(roleFromUrl)
    ? roleFromUrl
    : 'customer';

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <AuthCard initialMode="signup" initialRole={initialRole} />
    </main>
  );
}

export default RegisterPage;
