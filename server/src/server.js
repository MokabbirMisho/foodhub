import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './socket/socket.js';

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

initSocket(server);

// Start the API only after MongoDB connects successfully.
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`FoodHub server is running at http://localhost:${PORT}`);
  });
};

startServer();
