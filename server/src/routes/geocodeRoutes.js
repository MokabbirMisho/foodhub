import express from 'express';
import {
  geocodeAddress,
  reverseGeocodeLocation,
} from '../controllers/geocodeController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/address', protect, authorizeRoles('customer'), geocodeAddress);
router.post('/reverse', protect, authorizeRoles('customer'), reverseGeocodeLocation);

export default router;
