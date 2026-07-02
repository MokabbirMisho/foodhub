import express from 'express';
import {
  addMyAddress,
  changeMyPassword,
  deleteMyAddress,
  getMyAddresses,
  getMyProfile,
  setDefaultAddress,
  updateMyAddress,
  updateMyProfile,
} from '../controllers/customerProfileController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('customer'));

router.get('/profile', getMyProfile);
router.patch('/profile', updateMyProfile);
router.patch('/change-password', changeMyPassword);
router.get('/addresses', getMyAddresses);
router.post('/addresses', addMyAddress);
router.patch('/addresses/:addressId', updateMyAddress);
router.delete('/addresses/:addressId', deleteMyAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

export default router;
