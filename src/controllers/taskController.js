import { getIO } from "../config/socket.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import ProjectMember from "../models/ProjectMember.js";
import Task from "../models/Task.js";

export const addTask = async (req, res) => {
    const { projectId, title, description, status, assigneeId, deadline } = req.body;
    const userId = req.user.id;

    try {
        // Membership Check (Done by middleware, but adding fallback)
        const member = await ProjectMember.findOne({ userId, projectId});
        if (!member) {
            return res.status(403).json({ message: "Only project members can add tasks" });
        }

        // Also Check If Assignee Person Exists in DB !?
        const assigneExists = await ProjectMember.findOne({ userId: assigneeId, projectId });
        if (assigneeId && !assigneExists) {
            return res.status(400).json({ message: "Assignee must be a member of the project" });
        }
        
        const task = await Task.create({
            projectId,
            title,
            description,
            status: status || "TODO",
            assigneeId: assigneeId ,
            deadline: deadline || null,
        });

        // Activity Log
        await ActivityLog.create({
            userId,
            projectId,
            action: "TASK_CREATED",
            entityType: "TASK",
            entityId: task._id,
        });

        // Notifications to all members except creator
        const members = await ProjectMember.find({ projectId, userId: { $ne: userId } });
        const notifications = members.map(m => ({
            userId: m.userId,
            projectId,
            message: `New task created: "${title}"`,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // WebSocket Emit
        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_CREATED", { task });

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error("Add Task Error:", error);
        res.status(500).json({ message: "Internal server error while adding task" });
    }
};

export const listTasks = async (req, res) => {
    const { projectId } = req.query;
    const userId = req.user.id;

    try {
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }

        const member = await ProjectMember.findOne({ userId, projectId });
        if (!member) {
            return res.status(403).json({ message: "Access Denied" });
        }

        const tasks = await Task.find({ projectId }).populate("assigneeId", "username email");
        res.json(tasks);
    } catch (error) {
        console.error("List Tasks Error:", error);
        res.status(500).json({ message: "Internal server error while listing tasks" });
    }
};

export const updateTask = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectId = task.projectId;
        const member = await ProjectMember.findOne({ userId, projectId});
        if (!member) {
            return res.status(403).json({ message: "Access Denied" });
        }

        // Track changes for logs and notifications
        const oldStatus = task.status;
        const oldAssignee = task.assigneeId?.toString();

        Object.assign(task, updates);
        await task.save();

        let action = "TASK_UPDATED";
        if (updates.status && updates.status !== oldStatus) {
            action = updates.status === "DONE" ? "TASK_COMPLETED" : "TASK_UPDATED";
        } else if (updates.assigneeId && updates.assigneeId?.toString() !== oldAssignee) {
            action = "TASK_ASSIGNED";
        }

        // Activity Log
        await ActivityLog.create({
            userId,
            projectId,
            action,
            entityType: "TASK",
            entityId: task._id,
        });

        // Notifications
        const members = await ProjectMember.find({ projectId, isDeleted: false, userId: { $ne: userId } });
        const notifications = members.map(m => ({
            userId: m.userId,
            projectId,
            message: `Task updated: "${task.title}" (Action: ${action})`,
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // WebSocket Emit
        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_UPDATED", { task, action });

        res.json({ message: "Task updated successfully", task });
    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ message: "Internal server error while updating task" });
    }
};

export const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectId = task.projectId;
        const member = await ProjectMember.findOne({ userId, projectId, isDeleted: false });
        if (!member || member.role !== "OWNER") {
            return res.status(403).json({ message: "Only project owners can delete tasks" });
        }

        await Task.findByIdAndDelete(id);

        // Activity Log
        await ActivityLog.create({
            userId,
            projectId,
            action: "TASK_DELETED",
            entityType: "TASK",
            entityId: id,
        });

        // WebSocket Emit
        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_DELETED", { taskId: id });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Delete Task Error:", error);
        res.status(500).json({ message: "Internal server error while deleting task" });
    }
};
