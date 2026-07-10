import { useState } from 'react';
import { uploadFoodImage } from '../../services/uploadService';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  category: '',
  image: '',
  isVegetarian: false,
  preparationTime: 20,
  tags: '',
};

const getInitialFormData = (foodItem) => {
  if (!foodItem) {
    return emptyForm;
  }

  return {
    name: foodItem.name || '',
    description: foodItem.description || '',
    price: foodItem.price ?? '',
    discountPrice: foodItem.discountPrice ?? '',
    category: foodItem.category || '',
    image: foodItem.image || '',
    isVegetarian: foodItem.isVegetarian || false,
    preparationTime: foodItem.preparationTime ?? 20,
    tags: foodItem.tags?.join(', ') || '',
  };
};

const createPayload = (formData) => {
  const payload = {
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: Number(formData.price),
    category: formData.category.trim(),
    image: formData.image.trim(),
    isVegetarian: formData.isVegetarian,
    preparationTime: Number(formData.preparationTime) || 20,
    tags: formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };

  if (formData.discountPrice !== '') {
    payload.discountPrice = Number(formData.discountPrice);
  } else {
    payload.discountPrice = null;
  }

  return payload;
};

function FoodItemForm({ foodItem, mode = 'create', onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => getInitialFormData(foodItem));
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isEditMode = mode === 'edit';

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageFileChange = (event) => {
    setUploadError('');
    setImageFile(event.target.files?.[0] || null);
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setUploadError('Please choose a food image first');
      return;
    }

    try {
      setUploadError('');
      setIsImageUploading(true);
      const response = await uploadFoodImage(imageFile);
      setFormData((currentData) => ({
        ...currentData,
        image: response.data.imageUrl,
      }));
      setSuccessMessage('Food image uploaded successfully');
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setError('Food item name is required');
      return;
    }

    if (formData.price === '' || Number(formData.price) < 0) {
      setError('Valid price is required');
      return;
    }

    if (!formData.category.trim()) {
      setError('Category is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(createPayload(formData));
      setSuccessMessage(
        isEditMode ? 'Food item updated successfully' : 'Food item created successfully',
      );

      if (!isEditMode) {
        setFormData(emptyForm);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Name</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            name="name"
            onChange={handleChange}
            required
            value={formData.name}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Category</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            name="category"
            onChange={handleChange}
            required
            value={formData.category}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Description</span>
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            name="description"
            onChange={handleChange}
            value={formData.description}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Price</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            min="0"
            name="price"
            onChange={handleChange}
            required
            step="0.01"
            type="number"
            value={formData.price}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Discount price</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            min="0"
            name="discountPrice"
            onChange={handleChange}
            step="0.01"
            type="number"
            value={formData.discountPrice}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Preparation time
          </span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            min="0"
            name="preparationTime"
            onChange={handleChange}
            type="number"
            value={formData.preparationTime}
          />
        </label>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <span className="text-sm font-medium text-zinc-700">Food image</span>
          <div className="mt-3 space-y-3">
            {formData.image ? (
              <img
                alt="Food item preview"
                className="h-36 w-full rounded-lg object-cover"
                src={formData.image}
              />
            ) : (
              <div className="flex h-36 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#FF4F2E]">
                No image
              </div>
            )}
            <input
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="w-full text-sm text-zinc-700"
              onChange={handleImageFileChange}
              type="file"
            />
            <button
              className="rounded-xl bg-[#FF4F2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E63E22] disabled:cursor-not-allowed disabled:bg-stone-300"
              disabled={isImageUploading}
              onClick={handleUploadImage}
              type="button"
            >
              {isImageUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
          <input
            className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            name="image"
            onChange={handleChange}
            placeholder="Image URL"
            value={formData.image}
          />
        </div>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Tags</span>
          <input
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
            name="tags"
            onChange={handleChange}
            placeholder="spicy, popular, lunch"
            value={formData.tags}
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-md bg-stone-50 px-3 py-2">
        <input
          checked={formData.isVegetarian}
          className="h-4 w-4 accent-[#FF4F2E]"
          name="isVegetarian"
          onChange={handleChange}
          type="checkbox"
        />
        <span className="text-sm font-medium text-zinc-700">Vegetarian</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-[#FF4F2E] px-5 py-3 font-semibold text-white hover:bg-[#E63E22] disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Food Item'
              : 'Create Food Item'}
        </button>

        {onCancel && (
          <button
            className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-zinc-700 hover:bg-stone-50"
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

export default FoodItemForm;
