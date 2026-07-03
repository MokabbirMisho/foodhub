import { v2 as cloudinary } from 'cloudinary';

// Cloudinary stores uploaded images outside our server.
// The real values should live in server/.env, never in source code.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
