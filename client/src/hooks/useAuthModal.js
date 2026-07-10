import { useContext } from 'react';
import { AuthModalContext } from '../context/authModalContextValue';

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }

  return context;
};
