import jwt from 'jsonwebtoken';
import process from 'process';
import redisClient from '../config/redis.js';
import Session from '../models/Session.js';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Wrong Authorization Header Format' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token is Missing' });
  }

  try {
    // Verify Token First
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Check Redis first
    const cachedSession = await redisClient.get(`session:${decoded.sessionId}`);
    if (cachedSession) {
      const sessionData = JSON.parse(cachedSession);
      if (
        sessionData.status !== 'Online' ||
        new Date(sessionData.expiresAt) < new Date()
      ) {
        return res.status(401).json({ message: 'Session expired or invalid' });
      }
      // Attach User Info
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        sessionId: decoded.sessionId,
        isAdmin: decoded.isAdmin,
      };
      return next();
    }

    // Cache miss, check DB
    const session = await Session.findById(decoded.sessionId);
    if (
      !session ||
      session.status !== 'Online' ||
      session.expiresAt < new Date()
    ) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Update Redis for future
    await redisClient.set(
      `session:${session._id}`,
      JSON.stringify({
        userId: session.userId,
        status: session.status,
        expiresAt: session.expiresAt,
        isAdmin: decoded.isAdmin,
        email: decoded.email,
      }),
      { EX: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000) },
    );

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
      isAdmin: decoded.isAdmin,
    };

    return next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(401).json({ message: 'Invalid or Expired Token' });
  }
};
