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
      className="fh-btn-secondary w-fit"
      onClick={handleBack}
      type="button"
    >
      &larr; Back
    </button>
  );
}

export default BackButton;
