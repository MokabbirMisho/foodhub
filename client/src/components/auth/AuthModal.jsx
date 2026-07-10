import { useEffect } from 'react';
import AuthCard from '../common/AuthCard';
import { useAuthModal } from '../../hooks/useAuthModal';

function AuthModal() {
  const {
    authMode,
    closeAuthModal,
    isAuthModalOpen,
    redirectAfterLogin,
  } = useAuthModal();

  useEffect(() => {
    if (!isAuthModalOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        closeAuthModal();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [closeAuthModal, isAuthModalOpen]);

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="foodhub-auth-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={closeAuthModal}
      role="dialog"
    >
      <div
        className="relative my-auto w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="sr-only" id="foodhub-auth-title">
          Sign in or create a FoodHub account
        </h2>
        <button
          aria-label="Close sign in"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-zinc-600 shadow hover:bg-stone-50 hover:text-[#FF4F2E]"
          onClick={closeAuthModal}
          type="button"
        >
          ×
        </button>
        <AuthCard
          initialMode={authMode}
          key={authMode}
          onSuccess={closeAuthModal}
          redirectAfterLogin={redirectAfterLogin}
        />
      </div>
    </div>
  );
}

export default AuthModal;
