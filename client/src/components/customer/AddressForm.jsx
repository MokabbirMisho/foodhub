import { useEffect, useState } from 'react';
import {
  geocodeAddress,
  reverseGeocodeLocation,
} from '../../services/geocodeService';

const emptyAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: 'Germany',
  location: null,
  isDefault: false,
};

function AddressForm({ initialData, onCancel, onSubmit }) {
  const [formData, setFormData] = useState(emptyAddress);
  const [error, setError] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(
      initialData
        ? {
            ...emptyAddress,
            ...initialData,
            location: Number.isFinite(initialData.location?.lat)
              ? initialData.location
              : null,
          }
        : emptyAddress,
    );
    setError('');
    setLocationMessage('');
  }, [initialData]);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUseCurrentLocation = () => {
    setError('');
    setLocationMessage('');

    if (!navigator.geolocation) {
      setError('Location is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const location = {
          lat: coords.latitude,
          lng: coords.longitude,
          displayName: 'Current location',
        };

        setFormData((current) => ({ ...current, location }));

        try {
          const response = await reverseGeocodeLocation(location);
          const address = response.data;

          setFormData((current) => ({
            ...current,
            street: address.street || current.street,
            city: address.city || current.city,
            postalCode: address.postalCode || current.postalCode,
            country: address.country || current.country,
            location: {
              ...location,
              displayName: address.displayName || location.displayName,
            },
          }));
          setLocationMessage('Map location and address added');
        } catch (requestError) {
          setError(
            'Map location added, but the address could not be filled automatically.',
          );
        } finally {
          setIsLocating(false);
        }
      },
      (geolocationError) => {
        setIsLocating(false);
        setError(
          geolocationError.code === geolocationError.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access.'
            : 'Unable to get your current location.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleFindFromAddress = async () => {
    try {
      setError('');
      setLocationMessage('');
      setIsLocating(true);
      const response = await geocodeAddress({
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
      });
      setFormData((current) => ({
        ...current,
        location: response.data,
      }));
      setLocationMessage('Map location added');
    } catch (requestError) {
      setError('Could not find a map location from this address.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (
      !formData.street.trim() ||
      !formData.city.trim() ||
      !formData.postalCode.trim()
    ) {
      setError('Street, city, and postal code are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="fh-card p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['label', 'Label', 'Home'],
          ['fullName', 'Full name', 'Delivery recipient'],
          ['phone', 'Phone', 'Phone number'],
          ['street', 'Street', 'Street and house number'],
          ['city', 'City', 'City'],
          ['postalCode', 'Postal code', 'Postal code'],
          ['country', 'Country', 'Germany'],
        ].map(([name, label, placeholder]) => (
          <label className={name === 'street' ? 'md:col-span-2' : ''} key={name}>
            <span className="text-sm font-medium text-zinc-700">{label}</span>
            <input
              className="fh-input mt-1"
              name={name}
              onChange={handleChange}
              placeholder={placeholder}
              required={['street', 'city', 'postalCode'].includes(name)}
              value={formData[name]}
            />
          </label>
        ))}
      </div>

      <section className="mt-5 rounded-lg bg-stone-50 p-4">
        <p className="font-semibold text-zinc-900">Map location</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="fh-btn-primary text-sm"
            disabled={isLocating}
            onClick={handleUseCurrentLocation}
            type="button"
          >
            Use my current location
          </button>
          <button
            className="fh-btn-secondary text-sm"
            disabled={isLocating}
            onClick={handleFindFromAddress}
            type="button"
          >
            Find location from address
          </button>
        </div>
        {isLocating && <p className="mt-2 text-sm">Finding location...</p>}
        {formData.location && (
          <p className="mt-2 text-sm text-green-700">
            Map location added
            {formData.location.displayName
              ? `: ${formData.location.displayName}`
              : ''}
          </p>
        )}
        {locationMessage && (
          <p className="mt-1 text-sm text-green-700">{locationMessage}</p>
        )}
      </section>

      <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
        <input
          checked={formData.isDefault}
          className="accent-[#FF4F2E]"
          name="isDefault"
          onChange={handleChange}
          type="checkbox"
        />
        Set as default address
      </label>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="fh-btn-primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Address'
              : 'Save Address'}
        </button>
        {onCancel && (
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default AddressForm;
