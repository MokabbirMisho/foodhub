import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { validateEnvironment } from './config/env.js';
import { initSocket } from './socket/socket.js';

// Start the API only after MongoDB connects successfully.
const startServer = async () => {
  try {
    const { port } = validateEnvironment();
    await connectDB();

    // Express and Socket.io share one HTTP server and one port.
    const server = http.createServer(app);
    initSocket(server);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Stop the existing server before starting FoodHub again.`,
        );
        process.exit(1);
      }

      console.error('HTTP server failed to start');
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`FoodHub server is running on port ${port}`);
    });
  } catch (error) {
    console.error(`FoodHub startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
