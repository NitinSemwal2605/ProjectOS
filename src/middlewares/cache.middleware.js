import redisClient from '../config/redis.js';

export const cache =
  (role, ttl = 300) =>
  async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const userId = req.user.id;
    const id = req.params.id;

    // Generate unique cache key (user:45:role:project:id:123 or user:45:role:members)
    const key = id
      ? `user:${userId}:role:${role}:id:${id}`
      : `user:${userId}:role:${role}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`Cache Hit for key: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`Cache Miss for key: ${key}`);

      // Capture Data and Store in Redis Before Sending Response
      const originalJson = res.json;
      res.json = function (data) {
        // Restore original json method
        res.json = originalJson;

        // Store in Redis asynchronously
        redisClient.setEx(key, ttl, JSON.stringify(data)).catch((err) => {
          console.error('Redis Cache Set Error:', err);
        });

        // Send response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache Middleware Error:', error);
      next();
    }
  };

export const invalidateCache = async (userId, role, id = null) => {
  try {
    const key = id
      ? `user:${userId}:role:${role}:id:${id}`
      : `user:${userId}:role:${role}`;
    await redisClient.del(key);
    console.log(`Cache Invalidated for key: ${key}`);
  } catch (error) {
    console.error('Cache Invalidation Error:', error);
  }
};
