import express from 'express';
import {
  addMember,
  addProject,
  deleteProject,
  getMembers,
  listAllProjects,
  listProjectById,
  removeMember,
  updateMemberRole,
  updateProject,
} from '../controllers/projectController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { cache } from '../middlewares/cache.middleware.js';
import {
  isProjectMember,
  isProjectOwner,
} from '../middlewares/rbac.middleware.js';
import validater from '../middlewares/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator.js';

const router = express.Router();
router.use(authMiddleware);

// Project CRUD
/**
 * @swagger
 * /api/projects/addProject:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Project created successfully
 *       403:
 *         description: Unauthorized
 */
router.post('/addProject', validater(createProjectSchema), addProject);

/**
 * @swagger
 * /api/projects/listProjects:
 *   get:
 *     summary: List all projects (Admins see all, users see their own)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/listProjects', cache('project', 300), listAllProjects);

/**
 * @swagger
 * /api/projects/listProject/{id}:
 *   get:
 *     summary: Get project details by ID
 *     tags: [Projects]
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
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/listProject/:id', isProjectMember, cache('project', 300), listProjectById);

/**
 * @swagger
 * /api/projects/updateProject/{id}:
 *   patch:
 *     summary: Update project details
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
router.patch('/updateProject/:id', isProjectOwner, validater(updateProjectSchema), updateProject);

/**
 * @swagger
 * /api/projects/deleteProject/{id}:
 *   delete:
 *     summary: Soft delete a project
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 */
router.delete('/deleteProject/:id', isProjectOwner, deleteProject);

/**
 * @swagger
 * /api/projects/getMembers/{id}:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
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
 *         description: List of project members
 */
router.get('/getMembers/:id', isProjectMember, cache('members', 300), getMembers);

/**
 * @swagger
 * /api/projects/addMember/{id}:
 *   post:
 *     summary: Add members to project
 *     tags: [Projects]
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
 *             required: [members]
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId: { type: string }
 *                     role: { type: string, enum: [OWNER, MEMBER] }
 *     responses:
 *       201:
 *         description: Members added successfully
 */
router.post('/addMember/:id', isProjectOwner, addMember);

/**
 * @swagger
 * /api/projects/removeMember/{id}/{userId}:
 *   delete:
 *     summary: Remove a member from project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete('/removeMember/:id/:userId', isProjectOwner, removeMember);

/**
 * @swagger
 * /api/projects/updateMemberRole/{id}/{userId}:
 *   patch:
 *     summary: Update a member's role
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [OWNER, MEMBER] }
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.patch('/updateMemberRole/:id/:userId', isProjectOwner, updateMemberRole);

export default router;