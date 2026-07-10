import express from 'express';
import {
  changeMyPassword,
  getMe,
  googleAuth,
  googleSignIn,
  googleSignUp,
  loginUser,
  registerUser,
  updateMyAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/google/signup', authLimiter, googleSignUp);
router.post('/google/signin', authLimiter, googleSignIn);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMyAccount);
router.patch('/change-password', protect, changeMyPassword);

export default router;
