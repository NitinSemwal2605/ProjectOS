import express from 'express';
import { addTask, deleteTask, getAssignedTasks, listTasks, updateTaskDetails, updateTaskStatus } from '../controllers/taskController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { cache } from '../middlewares/cache.middleware.js';
import validater from '../middlewares/validate.middleware.js';
import { createTaskSchema, updateStatusSchema, updateTaskSchema } from '../validators/task.validator.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/tasks/addTask:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title]
 *             properties:
 *               projectId: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *               assigneeId: { type: string }
 *               deadline: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/addTask', validater(createTaskSchema), addTask);

/**
 * @swagger
 * /api/tasks/listTask:
 *   get:
 *     summary: List all tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/listTask', cache(300), listTasks);

/**
 * @swagger
 * /api/tasks/updateTaskDetails/{id}:
 *   patch:
 *     summary: Update task details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               assigneeId: { type: string }
 *               deadline: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.patch( '/updateTaskDetails/:id', validater(updateTaskSchema), updateTaskDetails,);

/**
 * @swagger
 * /api/tasks/updateTaskStatus/{id}:
 *   patch:
 *     summary: Update task status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch( '/updateTaskStatus/:id', validater(updateStatusSchema), updateTaskStatus,);

/**
 * @swagger
 * /api/tasks/deleteTask/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/deleteTask/:id', deleteTask);

/**
 * @swagger
 * /api/tasks/assignedTasks:
 *   get:
 *     summary: Get all tasks assigned to the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned tasks
 */
router.get('/assignedTasks', getAssignedTasks);

export default router;
