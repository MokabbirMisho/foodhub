import { useEffect } from 'react';
import AuthCard from './AuthCard';

function AuthModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="foodhub-auth-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
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
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <AuthCard onSuccess={onClose} />
      </div>
    </div>
  );
}

export default AuthModal;
