import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContextValue';
import {
  getMe,
  googleSignIn,
  googleSignUp,
  loginUser,
  logout as logoutUser,
  registerUser,
} from '../services/authService';

const getStoredUser = () => {
  const storedUser = localStorage.getItem('foodhub_user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem('foodhub_user');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('foodhub_token'));
  const [isLoading, setIsLoading] = useState(true);

  const saveAuthData = (authData) => {
    const nextToken = authData.data.token;
    const nextUser = authData.data.user;

    localStorage.setItem('foodhub_token', nextToken);
    localStorage.setItem('foodhub_user', JSON.stringify(nextUser));

    setToken(nextToken);
    setUser(nextUser);

    return nextUser;
  };

  const logout = useCallback(() => {
    logoutUser();
    setToken(null);
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((nextUser) => {
    const normalizedUser = {
      ...nextUser,
      id: nextUser.id || nextUser._id,
    };

    localStorage.setItem('foodhub_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('foodhub_token');

    if (!savedToken) {
      setIsLoading(false);
      return null;
    }

    try {
      setIsLoading(true);
      const response = await getMe();
      const currentUser = response.data.user;

      localStorage.setItem('foodhub_user', JSON.stringify(currentUser));
      setToken(savedToken);
      setUser(currentUser);

      return currentUser;
    } catch (error) {
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const clearExpiredAuth = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('foodhub:auth-cleared', clearExpiredAuth);
    return () =>
      window.removeEventListener('foodhub:auth-cleared', clearExpiredAuth);
  }, []);

  const register = async (formData) => {
    const response = await registerUser(formData);
    return saveAuthData(response);
  };

  const login = async (formData) => {
    const response = await loginUser(formData);
    return saveAuthData(response);
  };

  const signUpWithGoogle = async (credential) => {
    const response = await googleSignUp(credential);
    return saveAuthData(response);
  };

  const signInWithGoogle = async (credential) => {
    const response = await googleSignIn(credential);
    return saveAuthData(response);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      register,
      login,
      signUpWithGoogle,
      signInWithGoogle,
      logout,
      loadCurrentUser,
      updateCurrentUser,
    }),
    [user, token, isLoading, logout, loadCurrentUser, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
