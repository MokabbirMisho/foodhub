import express from 'express';
import {
  createReview,
  deleteMyReview,
  getAllReviewsForAdmin,
  getMyReviews,
  getRestaurantReviews,
  updateMyReview,
} from '../controllers/reviewController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('customer'), createReview);

// Specific routes must stay before /:id routes.
router.get('/my-reviews', protect, authorizeRoles('customer'), getMyReviews);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/admin/all', protect, authorizeRoles('admin'), getAllReviewsForAdmin);

router.patch('/:id', protect, authorizeRoles('customer'), updateMyReview);
router.delete('/:id', protect, authorizeRoles('customer'), deleteMyReview);

export default router;
