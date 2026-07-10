import { Navigate } from 'react-router-dom';
import AuthCard from '../../components/common/AuthCard';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/getDashboardPath';

function LoginPage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F7F4] px-6 py-12">
      <AuthCard initialMode="signin" />
    </main>
  );
}

export default LoginPage;
