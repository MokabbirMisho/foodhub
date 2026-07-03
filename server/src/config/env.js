const productionRequiredVariables = [
  'MONGO_URI',
  'JWT_SECRET',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const validEnvironments = ['development', 'test', 'production'];

  if (
    process.env.NODE_ENV &&
    !validEnvironments.includes(process.env.NODE_ENV)
  ) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  if (!process.env.NODE_ENV) {
    console.warn('Missing optional development env: NODE_ENV');
  }

  const missingVariables = productionRequiredVariables.filter(
    (name) => !process.env[name],
  );

  if (isProduction && missingVariables.length > 0) {
    throw new Error(
      `Missing required env: ${missingVariables.join(', ')}`,
    );
  }

  if (!isProduction) {
    missingVariables.forEach((name) => {
      console.warn(`Missing optional development env: ${name}`);
    });
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5001,
  };
};
