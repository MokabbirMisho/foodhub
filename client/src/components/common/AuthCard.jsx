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

function AuthCard({ initialMode = 'signin', initialRole = 'customer' }) {
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
    <section className="w-full max-w-md rounded-2xl bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur">
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            isSignIn ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-700'
          }`}
          onClick={() => setMode('signin')}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            !isSignIn ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-700'
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
        <p className="mt-2 text-sm text-slate-600">
          {isSignIn
            ? 'Sign in with your FoodHub account.'
            : 'Choose the account type that fits how you use FoodHub.'}
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {!isSignIn && (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
              name="name"
              onChange={handleChange}
              required
              type="text"
              value={formData.name}
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={formData.email}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={formData.password}
          />
        </label>

        {!isSignIn && (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Confirm Password
            </span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
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
            <span className="text-sm font-medium text-slate-700">Account type</span>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
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
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
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
          <GoogleLogin
            onError={() => setError('Google authentication failed')}
            onSuccess={handleGoogleSuccess}
            text={isSignIn ? 'signin_with' : 'signup_with'}
            width="100%"
          />
        ) : (
          <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            Restaurant owners and riders must sign up with email and password.
          </p>
        )}

        {isSignIn && (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Google sign in is available for customer accounts only.
          </p>
        )}

        {!isSignIn && formData.role === 'customer' && (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Google sign up creates a customer account by default. Restaurant
            and rider accounts can use email sign up for now.
          </p>
        )}
      </div>
    </section>
  );
}

export default AuthCard;
