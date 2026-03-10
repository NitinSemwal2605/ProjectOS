import dotenv from 'dotenv';
import { createServer } from 'http';
import process from 'process';
import app from './App.js';
import connectDB from './config/db.js';
import redisClient from './config/redis.js';
import { initSocket } from './config/socket.js';
import { startCompressionCron } from './cron/compressOldFiles.cron.js';
import { createRateLimiter } from './middlewares/ratelimiter.middleware.js';
import User from './models/User.js';
import { HashPassword } from './utils/token.js';

dotenv.config({ quiet: true });
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    // Wait for Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const server = createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Start Cron Job
    startCompressionCron();

    const rateLimiter = createRateLimiter();
    app.use(rateLimiter);

    // Check Admin Exists In Database.
    const AdminEmail = process.env.ADMIN_EMAIL;
    const AdminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({ email: AdminEmail });
    if (!existingAdmin) {
      const hashedPassword = await HashPassword(AdminPassword);
      const newAdmin = new User({
        username: 'Admin',
        email: AdminEmail,
        passwordHash: hashedPassword,
        provider: 'local',
        lastActiveAt: new Date(),
        isAdmin: true,
      });

      await newAdmin.save();

      console.log('Admin user created successfully.');
    } else {
      console.log('Admin User Already Exists.');
    }
  } catch (error) {
    console.error('Failed to Start The Server:', error.message);
    process.exit(1);
  }
};

startServer();
