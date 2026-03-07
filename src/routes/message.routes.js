import express from 'express';
import { deleteMessage, editMessage, getMessages } from '../controllers/messageController.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get chat history for a project
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/', getMessages);

/**
 * @swagger
 * /api/messages/{id}:
 *   patch:
 *     summary: Edit a message
 *     tags: [Messages]
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
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Message updated successfully
 */
router.patch('/:id', editMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Soft delete a message
 *     tags: [Messages]
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
 *         description: Message deleted successfully
 */
router.delete('/:id', deleteMessage);

export default router;