import express from 'express';
import {
  createReview,
  deleteOwnerReply,
  deleteMyReview,
  getAllReviewsForAdmin,
  getMyRestaurantReviews,
  getMyReviews,
  getRestaurantReviews,
  replyToReview,
  updateMyReview,
} from '../controllers/reviewController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('customer'), createReview);

// Specific routes must stay before /:id routes.
router.get('/my-reviews', protect, authorizeRoles('customer'), getMyReviews);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/admin/all', protect, authorizeRoles('admin'), getAllReviewsForAdmin);
router.get(
  '/owner/my-restaurant',
  protect,
  authorizeRoles('restaurant_owner'),
  getMyRestaurantReviews,
);
router.patch(
  '/owner/:reviewId/reply',
  protect,
  authorizeRoles('restaurant_owner'),
  replyToReview,
);
router.delete(
  '/owner/:reviewId/reply',
  protect,
  authorizeRoles('restaurant_owner'),
  deleteOwnerReply,
);

router.patch('/:id', protect, authorizeRoles('customer'), updateMyReview);
router.delete('/:id', protect, authorizeRoles('customer'), deleteMyReview);

export default router;
