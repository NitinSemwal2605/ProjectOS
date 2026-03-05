import express from "express";
import { login, logout, refresh, register, } from "../controllers/authController.js";
import validater from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validater(registerSchema), register);
router.post("/login", validater(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;