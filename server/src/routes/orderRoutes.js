import express from 'express';
import {
  acceptDelivery,
  cancelMyOrder,
  createOrder,
  getAllOrdersForAdmin,
  getAvailableDeliveriesForRider,
  getMyDeliveriesForRider,
  getMyOrders,
  getMyRestaurantOrders,
  getOrderById,
  markDeliveryAsDelivered,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('customer'), createOrder);

// Specific routes must stay before /:id routes.
router.get('/my-orders', protect, authorizeRoles('customer'), getMyOrders);
router.get(
  '/rider/available',
  protect,
  authorizeRoles('rider'),
  getAvailableDeliveriesForRider,
);
router.get(
  '/rider/my-deliveries',
  protect,
  authorizeRoles('rider'),
  getMyDeliveriesForRider,
);
router.get(
  '/restaurant/my-orders',
  protect,
  authorizeRoles('restaurant_owner'),
  getMyRestaurantOrders,
);
router.get('/admin/all', protect, authorizeRoles('admin'), getAllOrdersForAdmin);

router.patch('/:id/cancel', protect, authorizeRoles('customer'), cancelMyOrder);
router.patch('/:id/accept-delivery', protect, authorizeRoles('rider'), acceptDelivery);
router.patch(
  '/:id/mark-delivered',
  protect,
  authorizeRoles('rider'),
  markDeliveryAsDelivered,
);
router.patch(
  '/:id/status',
  protect,
  authorizeRoles('restaurant_owner'),
  updateOrderStatus,
);

router.get(
  '/:id',
  protect,
  authorizeRoles('customer', 'restaurant_owner', 'rider', 'admin'),
  getOrderById,
);

export default router;
