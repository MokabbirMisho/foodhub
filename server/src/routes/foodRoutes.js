import express from 'express';
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItemById,
  getMyRestaurantFoodItems,
  getPublicRestaurantFoodItems,
  searchPublicFoodItems,
  toggleFoodAvailability,
  updateFoodItem,
} from '../controllers/foodController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('restaurant_owner'), createFoodItem);

// These specific routes must stay before /:id.
router.get(
  '/my-restaurant',
  protect,
  authorizeRoles('restaurant_owner'),
  getMyRestaurantFoodItems,
);

router.get('/restaurant/:restaurantId', getPublicRestaurantFoodItems);
router.get('/search', searchPublicFoodItems);

router.patch(
  '/:id/availability',
  protect,
  authorizeRoles('restaurant_owner'),
  toggleFoodAvailability,
);

router.get('/:id', getFoodItemById);
router.patch('/:id', protect, authorizeRoles('restaurant_owner'), updateFoodItem);
router.delete('/:id', protect, authorizeRoles('restaurant_owner'), deleteFoodItem);

export default router;
