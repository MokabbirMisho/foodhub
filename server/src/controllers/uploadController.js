import cloudinary from '../config/cloudinary.js';

const sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

const uploadImage = async (req, res, folder) => {
  try {
    if (!req.file) {
      return sendErrorResponse(res, 400, 'Image file is required');
    }

    if (!isCloudinaryConfigured()) {
      return sendErrorResponse(res, 500, 'Cloudinary configuration is missing');
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, folder);

    sendSuccessResponse(res, 201, 'Image uploaded successfully', {
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 500, 'Image upload failed');
  }
};

export const uploadRestaurantLogo = async (req, res) => {
  await uploadImage(req, res, 'foodhub/restaurants/logos');
};

export const uploadRestaurantCover = async (req, res) => {
  await uploadImage(req, res, 'foodhub/restaurants/covers');
};

export const uploadFoodImage = async (req, res) => {
  await uploadImage(req, res, 'foodhub/foods');
};
