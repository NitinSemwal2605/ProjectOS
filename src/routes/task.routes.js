import express from 'express';
import { addTask, deleteTask, getAssignedTasks, listTasks, updateTaskDetails, updateTaskStatus } from '../controllers/taskController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { cache } from '../middlewares/cache.middleware.js';
import validater from '../middlewares/validate.middleware.js';
import { createTaskSchema, updateStatusSchema, updateTaskSchema } from '../validators/task.validator.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/addTask', validater(createTaskSchema), addTask);
router.get('/listTask', cache(300), listTasks);
router.patch( '/updateTaskDetails/:id', validater(updateTaskSchema), updateTaskDetails,);
router.patch( '/updateTaskStatus/:id', validater(updateStatusSchema), updateTaskStatus,);
router.delete('/deleteTask/:id', deleteTask);
router.get('/assignedTasks', getAssignedTasks);

export default router;
