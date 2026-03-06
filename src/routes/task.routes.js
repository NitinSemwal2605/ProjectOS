import express from "express";
import { addTask, deleteTask, listTasks, updateTaskDetails } from "../controllers/taskController.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { cache } from "../middlewares/cache.middleware.js";
const router = express.Router();

router.use(authMiddleware);

router.post("/addTask", addTask);
router.get("/listTask", cache(300), listTasks);
router.patch("/updateTaskDetails/:id", updateTaskDetails);
router.patch("/updateTaskStatus/:id", updateTaskDetails);
router.delete("/deleteTask/:id", deleteTask);

export default router;
