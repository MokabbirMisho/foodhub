import { useCallback, useMemo, useState } from 'react';
import { AuthModalContext } from './authModalContextValue';

export function AuthModalProvider({ children }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);

  const openAuthModal = useCallback((options = {}) => {
    if (options.mode) {
      setAuthMode(options.mode === 'signup' ? 'signup' : 'signin');
    }

    setRedirectAfterLogin(options.redirectTo || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setRedirectAfterLogin(null);
  }, []);

  const openLogin = useCallback(
    (options = {}) => {
      openAuthModal({ ...options, mode: 'signin' });
    },
    [openAuthModal],
  );

  const openSignup = useCallback(
    (options = {}) => {
      openAuthModal({ ...options, mode: 'signup' });
    },
    [openAuthModal],
  );

  const value = useMemo(
    () => ({
      authMode,
      closeAuthModal,
      isAuthModalOpen,
      openAuthModal,
      openLogin,
      openSignup,
      redirectAfterLogin,
      setAuthMode,
    }),
    [
      authMode,
      closeAuthModal,
      isAuthModalOpen,
      openAuthModal,
      openLogin,
      openSignup,
      redirectAfterLogin,
    ],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}
