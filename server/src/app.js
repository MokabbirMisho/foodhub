import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/corsOptions.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import customerProfileRoutes from './routes/customerProfileRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import geocodeRoutes from './routes/geocodeRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Add common security headers to every response.
app.use(helmet());

// Allow only the configured frontend origin to call the API from a browser.
app.use(cors(corsOptions));

// Keep JSON payloads small. Image files use Multer and have their own limit.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Protect demo deployments from excessive API traffic.
app.use('/api', apiLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route to confirm the API is running.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FoodHub API is running',
  });
});

// Authentication routes for email/password signup and login.
app.use('/api/auth', authRoutes);

// Admin-only user management routes.
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin', adminAnalyticsRoutes);

// Customer profile and saved delivery addresses.
app.use('/api/customer', customerProfileRoutes);

// Restaurant profile routes.
app.use('/api/restaurants', restaurantRoutes);

// Food/menu item routes.
app.use('/api/foods', foodRoutes);

// Lightweight, customer-only address lookup for checkout map coordinates.
app.use('/api/geocode', geocodeRoutes);

// Order routes.
app.use('/api/orders', orderRoutes);

// Image upload routes for restaurant owners.
app.use('/api/uploads', uploadRoutes);

// Restaurant review and rating routes.
app.use('/api/reviews', reviewRoutes);

// Handles requests to routes that do not exist.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null,
  });
});

// Handles errors from routes and middleware.
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Server error';

  if (err.name === 'MulterError') {
    statusCode = 400;
    errorMessage =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 3MB or smaller'
        : 'Image upload request is invalid';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    errorMessage = 'Invalid resource id';
  }

  if (err.code === 11000) {
    statusCode = 400;
    errorMessage = 'A record with this value already exists';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = Object.values(err.errors)
      .map((validationError) => validationError.message)
      .join(', ');
  }

  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Server error'
      : errorMessage;

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});

export default app;
