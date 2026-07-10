import { useNavigate } from 'react-router-dom';

function BackButton({
  className = '',
  fallbackPath = '/restaurants',
  variant = 'default',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  };

  const baseClassName =
    'inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-zinc-900';
  const variantClassName =
    variant === 'overlay' ? 'absolute left-4 top-4 z-20' : 'w-fit';

  return (
    <button
      className={`${baseClassName} ${variantClassName} ${className}`}
      onClick={handleBack}
      type="button"
    >
      &larr; Back
    </button>
  );
}

export default BackButton;
