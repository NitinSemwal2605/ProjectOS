import express from "express";
import { addTask, deleteTask, listTasks, updateTask } from "../controllers/taskController.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/addTask", addTask);
router.get("/listTask", listTasks);
router.patch("/updateTask/:id", updateTask);
router.delete("/deleteTask/:id", deleteTask);

export default router;
