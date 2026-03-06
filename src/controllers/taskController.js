import { getIO } from "../config/socket.js";
import { invalidateCache } from "../middlewares/cache.middleware.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import ProjectMember from "../models/ProjectMember.js";
import Task from "../models/Task.js";

const invalidateTaskCacheForProjectMembers = async (projectId) => {
    const members = await ProjectMember.find({ projectId }).select("userId");
    await Promise.all( //Parellel
        members.map((m) => invalidateCache(m.userId, "task", projectId))
    );
};

export const addTask = async (req, res) => {
    const { projectId, title, description, status, assigneeId, deadline } = req.body;
    const userId = req.user.id;

    try {

        // Membership Check
        const member = await ProjectMember.findOne({ userId, projectId });
        if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
            return res.status(403).json({ message: "Only project owners or admins can add tasks" });
        }

        // Check If Assignee Person Exists in DB !?
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
        const members = await ProjectMember.find({ projectId, userId: { $ne: userId } }); // Get All Members Except Creator
        const notifications = members.map(m => ({
            userId: m.userId,
            projectId,
            message: `New task created: "${title}"`,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Cache Implementations...
        await invalidateTaskCacheForProjectMembers(projectId);

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

    try {
        const userId = req.user.id;
        const member = await ProjectMember.findOne({ userId, projectId });
        if (!member) {
            return res.status(403).json({ message: "Only project members can view tasks" });
        }

        if (!projectId) {
            return res.status(400).json({ message: "ProjectID is required" });
        }
        const tasks = await Task.find({ projectId }).populate("assigneeId", "username email");
        res.json(tasks);
    } catch (error) {
        console.error("List Tasks Error:", error);
        res.status(500).json({ message: "Internal server error while listing tasks" });
    }
};


export const updateTaskDetails = async (req, res) => {
    const { id } = req.params; // Task ID
    const updates = req.body; // { title, description, assigneeId, deadline }
    const userId = req.user.id;

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectId = task.projectId;
        const member = await ProjectMember.findOne({ userId, projectId });

        if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
            return res.status(403).json({ message: "Only owners or admins can update tasks" });
        }

        const oldStatus = task.status;
        const oldAssignee = task.assigneeId?.toString();

        Object.assign(task, updates);
        await task.save();

        let action = "TASK_UPDATED";

        if(updates.status && updates.status !== oldStatus) {
            if(updates.status === "DONE") {
                action = "TASK_COMPLETED";
            }
            else{
                action = "TASK_UPDATED";
            }
        }

        if (updates.assigneeId && updates.assigneeId?.toString() !== oldAssignee) {
            action = "TASK_ASSIGNED";
        }

        await ActivityLog.create({
            userId,
            projectId,
            action,
            entityType: "TASK",
            entityId: task._id
        });

        const members = await ProjectMember.find({
            projectId,
            userId: { $ne: userId }
        });

        const notifications = members.map(m => ({
            userId: m.userId,
            projectId,
            message: `Task updated: "${task.title}" (Action: ${action})`
        }));

        if (notifications.length) {
            await Notification.insertMany(notifications);
        }

        // Cache Implementations...
        await invalidateTaskCacheForProjectMembers(projectId);

        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_UPDATED", { task, action });

        res.json({ message: "Task updated successfully", task });

    } catch (error) {
        console.error("Update Task Error:", error);
        res.status(500).json({ message: "Internal server error while updating task" });
    }
};

// Only Assignee can update the Task Status.
export const updateTaskStatus = async (req, res) => {
    const { id } = req.params; // Task ID
    const { status } = req.body;
    const userId = req.user.id;

    try {
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectId = task.projectId;
        const oldStatus = task.status;

        // Only Assignee can update the Task Status.
        if (task.assigneeId?.toString() !== userId) {
            return res.status(403).json({ message: "Only the assignee can update the task status" });
        }

        task.status = status;
        await task.save();

        let action; //CHECK
        if(status === "DONE" && oldStatus !== "DONE") {
            action = "TASK_COMPLETED";
        }
        else{
            action = "TASK_STATUS_UPDATED";
        }

        // Log Created
        await ActivityLog.create({
            userId,
            projectId,
            action,
            entityType: "TASK",
            entityId: task._id
        });

        const members = await ProjectMember.find({
            projectId,
            userId: { $ne: userId }
        });

        const notifications = members.map(m => ({
            userId: m.userId,
            projectId,
            message: `Task status updated: "${task.title}" → ${status}`
        }));

        if (notifications.length) {
            await Notification.insertMany(notifications);
        }

        // Cache Implementations...
        await invalidateTaskCacheForProjectMembers(projectId);

        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_STATUS_UPDATED", { task });

        res.json({
            message: "Task status updated successfully",
            task
        });

    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({
            message: "Internal server error while updating task status"
        });
    }
};


// Implement the Assigned Tasks Routes.
export const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectId = task.projectId;

        // Only Owner , Admin Can Delete
        const member = await ProjectMember.findOne({ userId, projectId });
        if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
            return res.status(403).json({ message: "Only owners or admins can delete tasks" });
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

        // Cache Implementations...
        await invalidateTaskCacheForProjectMembers(projectId);

        // WebSocket Emit
        const io = getIO();
        io.to(`project:${projectId}`).emit("TASK_DELETED", { taskId: id });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Delete Task Error:", error);
        res.status(500).json({ message: "Internal server error while deleting task" });
    }
};
