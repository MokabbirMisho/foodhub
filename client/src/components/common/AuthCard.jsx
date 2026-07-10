import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/getDashboardPath';

const allowedRoles = ['customer', 'restaurant_owner', 'rider'];

const roleLabels = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant Owner',
  rider: 'Rider',
};

function AuthCard({
  initialMode = 'signin',
  initialRole = 'customer',
  onSuccess,
}) {
  const navigate = useNavigate();
  const { login, register, signInWithGoogle, signUpWithGoogle } = useAuth();
  const safeInitialRole = allowedRoles.includes(initialRole)
    ? initialRole
    : 'customer';
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: safeInitialRole,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === 'signin';
  const canUseGoogle = isSignIn || formData.role === 'customer';

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleAuthSuccess = (authUser) => {
    onSuccess?.(authUser);
    navigate(getDashboardPath(authUser.role));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!isSignIn && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const authUser = isSignIn
        ? await login({
            email: formData.email,
            password: formData.password,
          })
        : await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          });

      handleAuthSuccess(authUser);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');

    try {
      const authUser = isSignIn
        ? await signInWithGoogle(credentialResponse.credential)
        : await signUpWithGoogle(credentialResponse.credential);

      handleAuthSuccess(authUser);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-4 text-zinc-900 shadow-2xl sm:p-6">
      <div className="grid grid-cols-2 rounded-xl bg-stone-50 p-1">
        <button
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            isSignIn ? 'bg-[#FF4F2E] text-white shadow-sm' : 'text-zinc-700'
          }`}
          onClick={() => setMode('signin')}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
            !isSignIn ? 'bg-[#FF4F2E] text-white shadow-sm' : 'text-zinc-700'
          }`}
          onClick={() => setMode('signup')}
          type="button"
        >
          Sign Up
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-bold">
          {isSignIn ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          {isSignIn
            ? 'Sign in with your FoodHub account.'
            : 'Choose the account type that fits how you use FoodHub.'}
        </p>
      </div>

      {error && (
        <p className="fh-alert-error mt-4">
          {error}
        </p>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {!isSignIn && (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Name</span>
            <input
              className="fh-input mt-1"
              name="name"
              onChange={handleChange}
              required
              type="text"
              value={formData.name}
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            className="fh-input mt-1"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={formData.email}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            className="fh-input mt-1"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={formData.password}
          />
        </label>

        {!isSignIn && (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Confirm Password
            </span>
            <input
              className="fh-input mt-1"
              name="confirmPassword"
              onChange={handleChange}
              required
              type="password"
              value={formData.confirmPassword}
            />
          </label>
        )}

        {!isSignIn && (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Account type</span>
            <select
              className="fh-input mt-1"
              name="role"
              onChange={handleChange}
              value={formData.role}
            >
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="fh-btn-primary w-full"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? isSignIn
              ? 'Signing in...'
              : 'Creating account...'
            : isSignIn
              ? 'Sign In'
              : 'Create Account'}
        </button>
      </form>

      <div className="mt-5">
        {canUseGoogle ? (
          <div className="flex w-full justify-center">
            <GoogleLogin
              onError={() => setError('Google authentication failed')}
              onSuccess={handleGoogleSuccess}
              text={isSignIn ? 'signin_with' : 'signup_with'}
              width={280}
            />
          </div>
        ) : (
          <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
            Restaurant owners and riders must sign up with email and password.
          </p>
        )}

        {isSignIn && (
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Google sign in is available for customer accounts only.
          </p>
        )}

        {!isSignIn && formData.role === 'customer' && (
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Google sign up creates a customer account by default. Restaurant
            and rider accounts can use email sign up for now.
          </p>
        )}
      </div>
    </section>
  );
}

export default AuthCard;
