import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";

export const socketAuthMiddleware = async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
        return next(new Error("Authentication error: Token not provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Check Valid Session in Redis
        const cached = await redisClient.get(`session:${decoded.id}`);
        if (!cached) {
            return next(new Error("Authentication error: Session expired or not found"));
        }

        // Attach Details to Socket
        socket.user = {
            id: decoded.id,
            email: decoded.email,
        };
        
        next();
    } catch (err) {
        console.error("Socket authentication error:", err.message);
        next(new Error("Authentication error: Invalid token"));
    }
};
