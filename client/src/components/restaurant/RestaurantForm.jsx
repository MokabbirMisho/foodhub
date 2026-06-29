import { useState } from 'react';
import {
  uploadRestaurantCover,
  uploadRestaurantLogo,
} from '../../services/uploadService';

const emptyForm = {
  name: '',
  description: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  postalCode: '',
  country: 'Germany',
  cuisineTypes: '',
  logo: '',
  coverImage: '',
  minimumOrderAmount: '',
  deliveryFee: '',
  estimatedDeliveryTime: '',
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  saturday: '',
  sunday: '',
  isOpen: true,
};

const getInitialFormData = (restaurant) => {
  if (!restaurant) {
    return emptyForm;
  }

  return {
    name: restaurant.name || '',
    description: restaurant.description || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    street: restaurant.address?.street || '',
    city: restaurant.address?.city || '',
    postalCode: restaurant.address?.postalCode || '',
    country: restaurant.address?.country || 'Germany',
    cuisineTypes: restaurant.cuisineTypes?.join(', ') || '',
    logo: restaurant.logo || '',
    coverImage: restaurant.coverImage || '',
    minimumOrderAmount: restaurant.minimumOrderAmount ?? '',
    deliveryFee: restaurant.deliveryFee ?? '',
    estimatedDeliveryTime: restaurant.estimatedDeliveryTime || '',
    monday: restaurant.openingHours?.monday || '',
    tuesday: restaurant.openingHours?.tuesday || '',
    wednesday: restaurant.openingHours?.wednesday || '',
    thursday: restaurant.openingHours?.thursday || '',
    friday: restaurant.openingHours?.friday || '',
    saturday: restaurant.openingHours?.saturday || '',
    sunday: restaurant.openingHours?.sunday || '',
    isOpen: restaurant.isOpen ?? true,
  };
};

const createPayload = (formData) => ({
  name: formData.name.trim(),
  description: formData.description.trim(),
  phone: formData.phone.trim(),
  email: formData.email.trim(),
  address: {
    street: formData.street.trim(),
    city: formData.city.trim(),
    postalCode: formData.postalCode.trim(),
    country: formData.country.trim() || 'Germany',
  },
  cuisineTypes: formData.cuisineTypes
    .split(',')
    .map((cuisine) => cuisine.trim())
    .filter(Boolean),
  logo: formData.logo.trim(),
  coverImage: formData.coverImage.trim(),
  minimumOrderAmount: Number(formData.minimumOrderAmount) || 0,
  deliveryFee: Number(formData.deliveryFee) || 0,
  estimatedDeliveryTime: formData.estimatedDeliveryTime.trim(),
  openingHours: {
    monday: formData.monday.trim(),
    tuesday: formData.tuesday.trim(),
    wednesday: formData.wednesday.trim(),
    thursday: formData.thursday.trim(),
    friday: formData.friday.trim(),
    saturday: formData.saturday.trim(),
    sunday: formData.sunday.trim(),
  },
  isOpen: formData.isOpen,
});

function RestaurantForm({ mode = 'create', onSubmit, restaurant }) {
  const [formData, setFormData] = useState(() => getInitialFormData(restaurant));
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isEditMode = mode === 'edit';

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleLogoFileChange = (event) => {
    setUploadError('');
    setLogoFile(event.target.files?.[0] || null);
  };

  const handleCoverFileChange = (event) => {
    setUploadError('');
    setCoverFile(event.target.files?.[0] || null);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      setUploadError('Please choose a logo image first');
      return;
    }

    try {
      setUploadError('');
      setIsLogoUploading(true);
      const response = await uploadRestaurantLogo(logoFile);
      setFormData((currentData) => ({
        ...currentData,
        logo: response.data.imageUrl,
      }));
      setSuccessMessage('Logo uploaded successfully');
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile) {
      setUploadError('Please choose a cover image first');
      return;
    }

    try {
      setUploadError('');
      setIsCoverUploading(true);
      const response = await uploadRestaurantCover(coverFile);
      setFormData((currentData) => ({
        ...currentData,
        coverImage: response.data.imageUrl,
      }));
      setSuccessMessage('Cover image uploaded successfully');
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(createPayload(formData));
      setSuccessMessage(
        isEditMode
          ? 'Restaurant updated successfully'
          : 'Restaurant created successfully',
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {uploadError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Restaurant name</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="name"
            onChange={handleChange}
            required
            type="text"
            value={formData.name}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="description"
            onChange={handleChange}
            value={formData.description}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="phone"
            onChange={handleChange}
            type="tel"
            value={formData.phone}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="email"
            onChange={handleChange}
            type="email"
            value={formData.email}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Street</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="street"
            onChange={handleChange}
            value={formData.street}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">City</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="city"
            onChange={handleChange}
            value={formData.city}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Postal code</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="postalCode"
            onChange={handleChange}
            value={formData.postalCode}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Country</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="country"
            onChange={handleChange}
            value={formData.country}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Cuisine types</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="cuisineTypes"
            onChange={handleChange}
            placeholder="Italian, Pizza, Vegan"
            value={formData.cuisineTypes}
          />
        </label>

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <span className="text-sm font-medium text-slate-700">Restaurant logo</span>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {formData.logo ? (
              <img
                alt="Restaurant logo preview"
                className="h-20 w-20 rounded-full object-cover"
                src={formData.logo}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xs font-semibold text-orange-700">
                No logo
              </div>
            )}
            <div className="flex-1 space-y-3">
              <input
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="w-full text-sm text-slate-700"
                onChange={handleLogoFileChange}
                type="file"
              />
              <button
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                disabled={isLogoUploading}
                onClick={handleUploadLogo}
                type="button"
              >
                {isLogoUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
            </div>
          </div>
          <input
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="logo"
            onChange={handleChange}
            placeholder="Logo URL"
            value={formData.logo}
          />
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <span className="text-sm font-medium text-slate-700">
            Restaurant cover image
          </span>
          <div className="mt-3 space-y-3">
            {formData.coverImage ? (
              <img
                alt="Restaurant cover preview"
                className="h-32 w-full rounded-lg object-cover"
                src={formData.coverImage}
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-orange-700">
                No cover image
              </div>
            )}
            <input
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="w-full text-sm text-slate-700"
              onChange={handleCoverFileChange}
              type="file"
            />
            <button
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
              disabled={isCoverUploading}
              onClick={handleUploadCover}
              type="button"
            >
              {isCoverUploading ? 'Uploading...' : 'Upload Cover'}
            </button>
          </div>
          <input
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="coverImage"
            onChange={handleChange}
            placeholder="Cover image URL"
            value={formData.coverImage}
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Minimum order amount
          </span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            min="0"
            name="minimumOrderAmount"
            onChange={handleChange}
            step="0.01"
            type="number"
            value={formData.minimumOrderAmount}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Delivery fee</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            min="0"
            name="deliveryFee"
            onChange={handleChange}
            step="0.01"
            type="number"
            value={formData.deliveryFee}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Estimated delivery time
          </span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="estimatedDeliveryTime"
            onChange={handleChange}
            placeholder="30-45 min"
            value={formData.estimatedDeliveryTime}
          />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Opening hours
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {[
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ].map((day) => (
            <label className="block" key={day}>
              <span className="text-sm font-medium capitalize text-slate-700">
                {day}
              </span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                name={day}
                onChange={handleChange}
                placeholder="10:00 - 22:00"
                value={formData[day]}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-md bg-orange-50 px-3 py-2">
        <input
          checked={formData.isOpen}
          className="h-4 w-4 accent-orange-600"
          name="isOpen"
          onChange={handleChange}
          type="checkbox"
        />
        <span className="text-sm font-medium text-slate-700">
          Restaurant is currently open
        </span>
      </label>

      <button
        className="rounded-md bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? isEditMode
            ? 'Updating...'
            : 'Creating...'
          : isEditMode
            ? 'Update Restaurant'
            : 'Create Restaurant'}
      </button>
    </form>
  );
}

export default RestaurantForm;
