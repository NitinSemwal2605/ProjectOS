import crypto from "crypto";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import AuditLog from "../models/AuditLog.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { ComparePassword, generateAccessToken, generateRefreshToken, HashPassword } from "../utils/token.js";

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "This Email is already registered" });
        }

        const hashedPassword = await HashPassword(password);
        // Create in DB
        const newUser = await User.create({
            username,
            email,
            passwordHash: hashedPassword,
            provider: "local",
            isAdmin: false,
            lastActiveAt: new Date(),
            deletedAt: null,
        });

        // Log Registration
        await AuditLog.create({
            userId: newUser._id,
            action: "USER_REGISTERED",
            targetType: "USER",
            targetId: newUser._id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        return res.status(201).json({
            message: "User Registered Successfully",
            userId: newUser._id,
        });

    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ message: "Internal server error during registration" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await ComparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const sessionId = crypto.randomUUID();
        const accessToken = generateAccessToken(user, sessionId);
        const refreshToken = generateRefreshToken(user, sessionId);

        const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Save in DB
        await Session.create({
            _id: sessionId,
            userId: user._id,
            refreshToken: refreshToken,
            expiresAt: sessionExpiry,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            status: "Online",
        });

        // Log Login & Session Creation
        await AuditLog.create({
            userId: user._id,
            action: "USER_LOGIN",
            targetType: "USER",
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        await AuditLog.create({
            userId: user._id,
            action: "SESSION_CREATED",
            targetType: "SESSION",
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { sessionId },
        });

        // Save the session to Redis for fast verification
        await redisClient.set(
            `session:${sessionId}`,
            JSON.stringify({
                userId: user._id,
                email: user.email,
                isAdmin: user.isAdmin,
                status: "Online",
                expiresAt: sessionExpiry
            }),
            { EX: 7 * 24 * 60 * 60 } // 7 days
        );

        // Set refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.json({
            message: "Login Successful",
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal server error during login" });
    }
};

export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken; // Get from The HttpOnly Cookie
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        // Find session in DB (as backup and for full data)
        const session = await Session.findById(decoded.sessionId);

        if (!session || session.status !== "Online" || session.expiresAt < new Date()) {
            return res.status(401).json({ message: "Session expired or invalid" });
        }

        if (session.refreshToken !== refreshToken) {
            // Token reuse or mismatch detected
            session.status = "Revoked";
            await session.save(); // Save Session
            await redisClient.del(`session:${session._id}`); // Remove Session
            
            // Log Revocation
            await AuditLog.create({
                userId: decoded.userId,
                action: "SESSION_REVOKED",
                targetType: "SESSION",
                targetId: decoded.userId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
                metadata: { sessionId: session._id, reason: "Token Reuse/Mismatch" },
            });

            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const newAccessToken = generateAccessToken(user, session._id);
        const newRefreshToken = generateRefreshToken(user, session._id);

        // Update session in DB
        session.refreshToken = newRefreshToken;
        await session.save();

        // Update Redis (keep existing expiry if still valid, or update if shifted)
        await redisClient.set(
            `session:${session._id}`,
            JSON.stringify({
                userId: user._id,
                email: user.email,
                isAdmin: user.isAdmin,
                status: "Online",
                expiresAt: session.expiresAt
            }),
            { EX: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000) }
        );

        // Set new refresh token in cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Create Audit Log for Token Refresh
        await AuditLog.create({
            userId: user._id,
            action: "TOKEN_REFRESHED",
            targetType: "SESSION",
            targetId: user._id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { sessionId: session._id },
        });

        return res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        console.error("Refresh Error:", error);
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
};

export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const sessionId = req.user?.sessionId;

    if (!sessionId && !refreshToken) {
        return res.status(400).json({ message: "Already logged out" });
    }

    try {
        if (sessionId) {
            await Session.findByIdAndUpdate(sessionId, { status: "Offline" });
            await redisClient.del(`session:${sessionId}`); // Remove Session
            
            // Log Logout
            await AuditLog.create({
                userId: req.user.id,
                action: "USER_LOGOUT",
                targetType: "USER",
                targetId: req.user.id,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
                metadata: { sessionId },
            });
        } else if (refreshToken) {
            const decoded = jwt.decode(refreshToken);
            if (decoded?.sessionId) {
                await Session.findByIdAndUpdate(decoded.sessionId, { status: "Offline" });
                await redisClient.del(`session:${decoded.sessionId}`); // Remove Session

                // Log Logout
                await AuditLog.create({
                    userId: decoded.userId,
                    action: "USER_LOGOUT",
                    targetType: "USER",
                    targetId: decoded.userId,
                    ipAddress: req.ip,
                    userAgent: req.headers["user-agent"],
                    metadata: { sessionId: decoded.sessionId },
                });
            }
        }

        res.clearCookie("refreshToken");
        return res.json({ message: "Logged out successfully" });

    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Internal server error during logout" });
    }
};
