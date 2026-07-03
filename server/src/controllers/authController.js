import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

const googleClient = new OAuth2Client();

const createUserData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  authProvider: user.authProvider,
  isBlocked: user.isBlocked,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sendAuthResponse = (res, statusCode, user) => {
  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful',
    data: {
      token: generateToken(user._id),
      user: createUserData(user),
    },
  });
};

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const handleAuthError = (res, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  // MongoDB duplicate key error, usually caused by a duplicate email.
  if (error.code === 11000) {
    return sendErrorResponse(res, 400, 'User already exists');
  }

  // Mongoose schema validation error.
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');

    return sendErrorResponse(res, 400, message);
  }

  if (error.message === 'JWT_SECRET is missing from environment variables') {
    return sendErrorResponse(res, 500, 'JWT_SECRET is missing from environment variables');
  }

  if (error.message === 'GOOGLE_CLIENT_ID is missing from environment variables') {
    return sendErrorResponse(res, 500, 'GOOGLE_CLIENT_ID is missing from environment variables');
  }

  return sendErrorResponse(res, 500, 'Server error');
};

const verifyGoogleCredential = async (credential) => {
  if (!credential) {
    throw new Error('Google credential is required');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is missing from environment variables');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const googleId = payload?.sub;
  const email = payload?.email;
  const name = payload?.name;
  const picture = payload?.picture;

  if (!email) {
    throw new Error('Google account email is required');
  }

  if (!googleId) {
    throw new Error('Google account id is required');
  }

  return {
    googleId,
    email,
    name,
    picture,
  };
};

const linkGoogleToLocalCustomer = async (user, googleId, picture) => {
  const updates = { googleId };

  if (!user.avatar && picture) {
    updates.avatar = picture;
  }

  return User.findByIdAndUpdate(user._id, updates, {
    new: true,
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;

    if (!name || !email || !password) {
      return sendErrorResponse(res, 400, 'Name, email, and password are required');
    }

    if (password.length < 6) {
      return sendErrorResponse(
        res,
        400,
        'Password must be at least 6 characters',
      );
    }

    // Admin accounts should be created only by trusted internal tools, not public signup.
    const allowedPublicRoles = ['customer', 'restaurant_owner', 'rider'];

    if (!allowedPublicRoles.includes(role)) {
      return sendErrorResponse(res, 400, 'Invalid role for public registration');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return sendErrorResponse(res, 400, 'User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      authProvider: 'local',
    });

    sendAuthResponse(res, 201, user);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendErrorResponse(res, 400, 'Email and password are required');
    }

    // Password is hidden by default in the model, so we select it only for login.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    if (user.authProvider !== 'local') {
      return sendErrorResponse(res, 400, 'Please sign in using your original login method');
    }

    if (user.isBlocked) {
      return sendErrorResponse(
        res,
        403,
        'Your account has been blocked. Please contact support.',
      );
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return sendErrorResponse(res, 400, 'Google credential is required');
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is missing from environment variables');
    }

    let ticket;

    try {
      // Verify the Google ID token on the backend before trusting its user data.
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }

      return sendErrorResponse(res, 401, 'Invalid Google credential');
    }

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name;
    const picture = payload?.picture;

    if (!email) {
      return sendErrorResponse(res, 400, 'Google account email is required');
    }

    if (!googleId) {
      return sendErrorResponse(res, 400, 'Google account id is required');
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.isBlocked) {
        return sendErrorResponse(
          res,
          403,
          'Your account has been blocked. Please contact support.',
        );
      }

      if (user.googleId && user.googleId !== googleId) {
        return sendErrorResponse(res, 400, 'Google account does not match this user');
      }

      // If this email already has a local account, link the Google id for future sign-ins.
      if (user.authProvider === 'local' && !user.googleId) {
        const updates = { googleId };

        if (!user.avatar && picture) {
          updates.avatar = picture;
        }

        user = await User.findByIdAndUpdate(user._id, updates, {
          new: true,
        });
      }
    } else {
      user = await User.create({
        name,
        email,
        avatar: picture,
        googleId,
        authProvider: 'google',
        role: 'customer',
      });
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const googleSignUp = async (req, res) => {
  try {
    const { credential } = req.body;
    let googleUser;

    try {
      googleUser = await verifyGoogleCredential(credential);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }

      if (error.message === 'Google credential is required') {
        return sendErrorResponse(res, 400, error.message);
      }

      if (
        error.message === 'GOOGLE_CLIENT_ID is missing from environment variables' ||
        error.message === 'Google account email is required' ||
        error.message === 'Google account id is required'
      ) {
        return sendErrorResponse(res, 400, error.message);
      }

      return sendErrorResponse(res, 401, 'Invalid Google credential');
    }

    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      if (user.isBlocked) {
        return sendErrorResponse(
          res,
          403,
          'Your account has been blocked. Please contact support.',
        );
      }

      if (user.role !== 'customer') {
        return sendErrorResponse(
          res,
          400,
          'Google sign up is only available for customer accounts.',
        );
      }

      if (user.googleId && user.googleId !== googleUser.googleId) {
        return sendErrorResponse(res, 400, 'Google account does not match this user');
      }

      if (user.authProvider === 'local' && !user.googleId) {
        user = await linkGoogleToLocalCustomer(
          user,
          googleUser.googleId,
          googleUser.picture,
        );
      }
    } else {
      // Google signup always creates a customer account.
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        googleId: googleUser.googleId,
        authProvider: 'google',
        role: 'customer',
      });
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const googleSignIn = async (req, res) => {
  try {
    const { credential } = req.body;
    let googleUser;

    try {
      googleUser = await verifyGoogleCredential(credential);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }

      if (error.message === 'Google credential is required') {
        return sendErrorResponse(res, 400, error.message);
      }

      if (
        error.message === 'GOOGLE_CLIENT_ID is missing from environment variables' ||
        error.message === 'Google account email is required' ||
        error.message === 'Google account id is required'
      ) {
        return sendErrorResponse(res, 400, error.message);
      }

      return sendErrorResponse(res, 401, 'Invalid Google credential');
    }

    const user = await User.findOne({ email: googleUser.email });

    if (!user) {
      return sendErrorResponse(res, 404, 'No account found. Please sign up first.');
    }

    if (user.isBlocked) {
      return sendErrorResponse(
        res,
        403,
        'Your account has been blocked. Please contact support.',
      );
    }

    if (user.role !== 'customer') {
      return sendErrorResponse(
        res,
        400,
        'Google sign in is only available for customer accounts.',
      );
    }

    if (user.googleId && user.googleId !== googleUser.googleId) {
      return sendErrorResponse(res, 400, 'Google account does not match this user');
    }

    sendAuthResponse(res, 200, user);
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        user: createUserData(req.user),
      },
    });
  } catch (error) {
    handleAuthError(res, error);
  }
};
