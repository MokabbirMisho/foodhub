import express from 'express';
import {
  approveRestaurant,
  createRestaurant,
  getAllRestaurants,
  getAllRestaurantsForAdmin,
  getMyRestaurant,
  getRestaurantById,
  rejectRestaurant,
  updateMyRestaurantAvailability,
  updateMyRestaurant,
} from '../controllers/restaurantController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { getMyRestaurantAnalytics } from '../controllers/restaurantAnalyticsController.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('restaurant_owner'), createRestaurant);
router.get('/', getAllRestaurants);

// Admin approval routes must stay before /:id routes.
router.get(
  '/admin/all',
  protect,
  authorizeRoles('admin'),
  getAllRestaurantsForAdmin,
);

// Keep this route before /:id so Express does not treat "my-restaurant" as an id.
router.get(
  '/my-restaurant/analytics',
  protect,
  authorizeRoles('restaurant_owner'),
  getMyRestaurantAnalytics,
);

router.get(
  '/my-restaurant',
  protect,
  authorizeRoles('restaurant_owner'),
  getMyRestaurant,
);

router.patch(
  '/my-restaurant/availability',
  protect,
  authorizeRoles('restaurant_owner'),
  updateMyRestaurantAvailability,
);

router.patch(
  '/my-restaurant',
  protect,
  authorizeRoles('restaurant_owner'),
  updateMyRestaurant,
);

router.patch(
  '/:id/approve',
  protect,
  authorizeRoles('admin'),
  approveRestaurant,
);

router.patch(
  '/:id/reject',
  protect,
  authorizeRoles('admin'),
  rejectRestaurant,
);

router.get('/:id', getRestaurantById);

export default router;
