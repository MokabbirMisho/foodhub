import express from 'express';
import {
  uploadFoodImage,
  uploadRestaurantCover,
  uploadRestaurantLogo,
} from '../controllers/uploadController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Restaurant owners upload image files using the form field name "image".
router.post(
  '/restaurant-logo',
  protect,
  authorizeRoles('restaurant_owner'),
  upload.single('image'),
  uploadRestaurantLogo,
);

router.post(
  '/restaurant-cover',
  protect,
  authorizeRoles('restaurant_owner'),
  upload.single('image'),
  uploadRestaurantCover,
);

router.post(
  '/food-image',
  protect,
  authorizeRoles('restaurant_owner'),
  upload.single('image'),
  uploadFoodImage,
);

export default router;
