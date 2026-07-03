import rateLimit from 'express-rate-limit';

const rateLimitResponse = {
  success: false,
  message: 'Too many requests. Please try again later.',
  data: null,
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ...rateLimitResponse,
    message: 'Too many authentication attempts. Please try again later.',
  },
});
