import express from "express";
import { deleteMessage, editMessage, getMessages } from "../controllers/messageController.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getMessages);
router.patch("/:id", editMessage);
router.delete("/:id", deleteMessage);

export default router;