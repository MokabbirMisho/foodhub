import express from 'express';
import {
  getMe,
  googleAuth,
  googleSignIn,
  googleSignUp,
  loginUser,
  registerUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/google/signup', googleSignUp);
router.post('/google/signin', googleSignIn);
router.get('/me', protect, getMe);

export default router;
