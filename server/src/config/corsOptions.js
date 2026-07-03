const deployedClientUrl = 'https://foodhub-phi-wine.vercel.app';

export const getAllowedOrigins = () => {
  const origins = [process.env.CLIENT_URL, deployedClientUrl];

  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173');
  }

  return [...new Set(origins.filter(Boolean))];
};

export const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Requests without an Origin header include server-to-server tools and curl.
    if (!origin || getAllowedOrigins().includes(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error('Origin is not allowed by CORS');
    error.statusCode = 403;
    callback(error);
  },
};
