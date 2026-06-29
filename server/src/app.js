import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Add common security headers to every response.
app.use(helmet());

// Allow only the configured frontend origin to call the API from a browser.
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

// Keep JSON payloads small. Image files use Multer and have their own limit.
app.use(express.json({ limit: '1mb' }));

// Protect demo deployments from excessive API traffic.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
      data: null,
    },
  }),
);

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

// Restaurant profile routes.
app.use('/api/restaurants', restaurantRoutes);

// Food/menu item routes.
app.use('/api/foods', foodRoutes);

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

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Server error'
      : err.message || 'Server error';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});

export default app;
