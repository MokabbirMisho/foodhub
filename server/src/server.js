import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './socket/socket.js';

const PORT = process.env.PORT || 5001;

// Start the API only after MongoDB connects successfully.
const startServer = async () => {
  await connectDB();

  // Express and Socket.io share one HTTP server and one port.
  const server = http.createServer(app);
  initSocket(server);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the existing server before starting FoodHub again.`,
      );
      process.exit(1);
    }

    throw error;
  });

  server.listen(PORT, () => {
    console.log(`FoodHub server is running at http://localhost:${PORT}`);
  });
};

startServer();
