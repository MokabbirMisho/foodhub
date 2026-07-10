import express from 'express';
import {
  getAllUsersForAdmin,
  getRiderDetailsForAdmin,
  getUserByIdForAdmin,
  toggleUserBlockStatus,
} from '../controllers/adminUserController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/', getAllUsersForAdmin);
router.get('/riders/:riderId/details', getRiderDetailsForAdmin);
router.get('/:id', getUserByIdForAdmin);
router.patch('/:id/block', toggleUserBlockStatus);

export default router;
