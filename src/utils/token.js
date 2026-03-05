import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import process from "process";

dotenv.config({quiet:true});

export const generateAccessToken = (user, sessionId) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      sessionId: sessionId,
      isAdmin: user.isAdmin
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7D" } // For Development Only
  );
};

export const generateRefreshToken = (user, sessionId) => {
  return jwt.sign({
    userId: user._id,
    sessionId: sessionId,
  },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: "7d" }
  );
};


export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export const HashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
}

export const ComparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}