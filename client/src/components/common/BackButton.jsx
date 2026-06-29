import { useNavigate } from 'react-router-dom';

function BackButton({ fallbackPath = '/restaurants' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  };

  return (
    <button
      className="inline-flex w-fit items-center rounded-md border border-orange-200 bg-white px-4 py-2 font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
      onClick={handleBack}
      type="button"
    >
      &larr; Back
    </button>
  );
}

export default BackButton;
