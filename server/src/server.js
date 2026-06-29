import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5001;

// Start the API only after MongoDB connects successfully.
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`FoodHub server is running at http://localhost:${PORT}`);
  });
};

startServer();
