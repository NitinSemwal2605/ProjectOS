import express from "express";
import {
    addMember, addProject, deleteProject,
    getMembers,
    listAllProjects, listProjectById,
    removeMember, updateMemberRole, updateProject
} from "../controllers/projectController.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { cache } from "../middlewares/cache.middleware.js";
import { isProjectMember, isProjectOwner } from "../middlewares/rbac.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Project CRUD
router.post("/addProject", addProject);
router.get("/listProjects", cache("project", 300), listAllProjects);
router.get("/listProject/:id", isProjectMember  , cache("project", 300), listProjectById);
router.patch("/updateProject/:id", isProjectOwner, updateProject);
router.delete("/deleteProject/:id", isProjectOwner, deleteProject);

// Member Management
router.get("/getMembers/:id", isProjectMember, cache("members", 300), getMembers);
router.post("/addMember/:id", isProjectOwner, addMember);
router.delete("/removeMember/:id/:userId", isProjectOwner, removeMember);
router.patch("/updateMemberRole/:id/:userId", isProjectOwner, updateMemberRole);

export default router;