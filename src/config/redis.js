import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config({ quiet: true });

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Could not connect to Redis', error);
  }
};

connectRedis();

export default redisClient;
