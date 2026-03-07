import { getIO } from '../config/socket.js';
import { invalidateCache } from '../middlewares/cache.middleware.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';

const invalidateProjectCacheForUsers = async (userIds, projectId) => {
  const uniqueUserIds = [...new Set(userIds.map(String))];
  await Promise.all(
    uniqueUserIds.flatMap((uid) => [
      invalidateCache(uid, 'project'),
      invalidateCache(uid, 'project', projectId),
      invalidateCache(uid, 'members', projectId),
    ]),
  );
};

// Invalidate Project Cache for Members
const invalidateProjectCacheForProjectMembers = async (projectId) => {
  const members = await ProjectMember.find({ projectId }).select('userId');
  await invalidateProjectCacheForUsers(
    members.map((m) => m.userId),
    projectId,
  );
};

export const addProject = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;

  try {
    const project = await Project.create({
      title,
      description,
      createdBy: userId,
    });

    await ProjectMember.create({
      projectId: project._id,
      userId: userId,
      role: 'OWNER',
    });

    const notification = await Notification.create({
      userId: userId,
      projectId: project._id,
      message: "Nice , You've created a new project.",
    });

    // Notification to Owner 
    const io = getIO();
    io.to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });

    await ActivityLog.create({
      userId,
      projectId: project._id,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project._id,
    });

    // centralized cache invalidation
    await invalidateProjectCacheForUsers([userId], project._id);

    res.status(201).json({ message: 'Project created Successfully', project });
  } catch (error) {
    console.log('Error Occured While Adding Projects');
    res
      .status(500)
      .json({ message: 'Internal server error while creating project' });
  }
};

// Where User is Included
export const listAllProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.isAdmin) {
      projects = await Project.find({ isDeleted: false });
    } 
    else {
      const memberships = await ProjectMember.find({ userId }).select(
        'projectId',
      );

      const projectIds = memberships.map((m) => m.projectId);
      projects = await Project.find({
        _id: { $in: projectIds },
        isDeleted: false,
      });
    }

    res.json(projects);
  } catch (error) {
    console.log('Error Occured While Listing Projects');
    res
      .status(500)
      .json({ message: 'Internal server error while listing All Project' });
  }
};

// Only members can view project details.
export const listProjectById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Project ID

    // If Not admin then Check
    if (!req.user.isAdmin) {
      const members = await ProjectMember.findOne({ userId, projectId: id });
      if (!members) {
        return res.status(403).json({ message: 'Access Denied' });
      }
    }

    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.log('Error Occured While Fetching Project by ID');
    res
      .status(500)
      .json({ message: 'Internal server error while listing this project' });
  }
};

// Only owners can update projects.
export const updateProject = async (req, res) => {
  const { title, description } = req.body;
  try {
    const userId = req.user.id;
    const { id } = req.params; // Project ID

    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If Not admin then Check Role
    if (!req.user.isAdmin) {
      const members = await ProjectMember.findOne({ userId, projectId: id });
      if (!members || members.role !== 'OWNER') {
        return res
          .status(403)
          .json({ message: 'Only project owners can update the project' });
      }
    }

    if (title){
      project.title = title;
    }
    if (description){
      project.description = description;
    }

    await project.save();

    const notifyingMembers = await ProjectMember.find({
      projectId: id,
      userId: { $ne: userId },
    });

    // Create NotificationData Array
    const notificationData = notifyingMembers.map((m) => ({
      userId: m.userId,
      projectId: id,
      message: `Project "${project.title}" has been updated at ${new Date().toLocaleString()}.`,
    }));

    if (notificationData.length > 0) {
      const savedNotifications = await Notification.insertMany(notificationData);
      const io = getIO();
      // Emit to All Members
      savedNotifications.forEach((notif) => {
        io.to(`user:${notif.userId}`).emit('NOTIFICATION_NEW', {
          notification: notif,
        });
      });
    }

    // Log Creation
    await ActivityLog.create({
      userId,
      projectId: project._id,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
    });

    await invalidateProjectCacheForProjectMembers(id);

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    console.log('Error Occured While Updating Project');
    res
      .status(500)
      .json({ message: 'Internal server error while updating project' });
  }
};

// Only owners can delete projects (soft delete).
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!req.user.isAdmin) {
      const member = await ProjectMember.findOne({ userId, projectId: id });
      if (!member || member.role !== 'OWNER') {
        return res
          .status(403)
          .json({ message: 'Only project owners can delete the project' });
      }
    }

    const project = await Project.findById(id);
    if (!project || project.isDeleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.isDeleted = true;
    await project.save();

    const notifyingMembers = await ProjectMember.find({
      projectId: id,
      userId: { $ne: userId },
    });
    // Take Notification Array
    const notificationData = notifyingMembers.map((m) => ({
      userId: m.userId,
      projectId: id,
      message: `Project "${project.title}" has been deleted at ${new Date().toLocaleString()}.`,
    }));

    // Emit to All Members
    if (notificationData.length > 0) {
      const savedNotifications = await Notification.insertMany(notificationData);
      const io = getIO();
      savedNotifications.forEach((notif) => {
        io.to(`user:${notif.userId}`).emit('NOTIFICATION_NEW', {
          notification: notif,
        });
      });
    }

    // Log Creation
    await ActivityLog.create({
      userId,
      projectId: project._id,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: project._id,
    });

    await invalidateProjectCacheForProjectMembers(id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.log('Error Occured While Deleting Project');
    res
      .status(500)
      .json({ message: 'Internal server error while deleting project' });
  }
};

// List all members of a project
export const getMembers = async (req, res) => {
  const { id: projectId } = req.params;
  try {
    const members = await ProjectMember.find({ projectId }).populate(
      'userId',
      'username email',
    );
    if (!members || members.length === 0) {
      return res
        .status(404)
        .json({ message: 'No members found for this project' });
    }

    res.json(members);
  } catch (error) {
    console.error('Get Members Error:', error);
    res
      .status(500)
      .json({ message: 'Internal server error while fetching members' });
  }
};


export const addMember = async (req, res) => {
  const { id: projectId } = req.params;
  const { members } = req.body;

  try {
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members array is required' });
    }

    const requestingUserId = req.user.id;
    // If user not Admin 
    if (!req.user.isAdmin) {
      const requester = await ProjectMember.findOne({
        projectId,
        userId: requestingUserId,
      });

      if (!requester || requester.role !== 'OWNER') {
        return res
          .status(403)
          .json({ message: 'Only project owners can add members' });
      }
    }

    const project = await Project.findById(projectId).select('title');

    const addedMembers = [];
    const skippedMembers = [];

    for (const memberData of members) {
      const { userId, role } = memberData;

      if (!userId) {
        skippedMembers.push({ userId, reason: 'userId missing' });
        continue;
      }

      const existingMember = await ProjectMember.findOne({ projectId, userId });

      if (existingMember && !existingMember.isDeleted) {
        skippedMembers.push({ userId, reason: 'Already a member' });
        continue;
      }

      if (existingMember && existingMember.isDeleted) {
        existingMember.isDeleted = false;
        if (role) existingMember.role = role;
        await existingMember.save();
        addedMembers.push(existingMember);

        // Log Activity
        await ActivityLog.create({
          userId: requestingUserId,
          projectId,
          action: 'MEMBER_ADDED',
          entityType: 'MEMBER',
          entityId: userId,
        });

        // Notify User
        const notification = await Notification.create({
          userId,
          projectId,
          message: `You have been added to project: ${project?.title || 'New Project'} as ${role || existingMember.role || 'MEMBER'}`,
        });

        getIO().to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });
        continue;
      }

      const newMember = await ProjectMember.create({
        projectId,
        userId,
        role: role || 'MEMBER',
      });

      addedMembers.push(newMember);

      // Log Activity
      await ActivityLog.create({
        userId: requestingUserId,
        projectId,
        action: 'MEMBER_ADDED',
        entityType: 'MEMBER',
        entityId: userId,
      });

      // Notify User
      const notification = await Notification.create({
        userId,
        projectId,
        message: `You have been added to project: ${project?.title || 'New Project'} as ${role || 'MEMBER'}`,
      });

      getIO().to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });
    }

    // centralized cache invalidation
    await invalidateProjectCacheForProjectMembers(projectId);

    res.status(201).json({
      message: 'Members Has Been Added Successfully',
      addedMembers,
      skippedMembers,
    });
  } catch (error) {
    console.log('Error while adding members:', error);
    res
      .status(500)
      .json({ message: 'Internal server error while adding members' });
  }
};

export const removeMember = async (req, res) => {
  const { id: projectId } = req.params;
  const { members } = req.body;

  try {
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members array is required' });
    }

    const requestingUserId = req.user.id;
    if (!req.user.isAdmin) {
      const requester = await ProjectMember.findOne({
        projectId,
        userId: requestingUserId,
      });

      if (!requester || requester.role !== 'OWNER') {
        return res
          .status(403)
          .json({ message: 'Only project owners can remove members' });
      }
    }

    const project = await Project.findById(projectId).select('title');

    const removedMembers = [];
    const skippedMembers = [];

    for (const member of members) {
      const userId = member.userId;

      if (!userId) {
        skippedMembers.push({ userId: null, reason: 'userId missing' });
        continue;
      }

      if (userId === requestingUserId) {
        skippedMembers.push({
          userId,
          reason: 'Owner cannot remove themselves',
        });
        continue;
      }

      const removedMember = await ProjectMember.findOneAndDelete({
        projectId,
        userId,
      });

      if (!removedMember) {
        skippedMembers.push({ userId, reason: 'Not a project member' });
        continue;
      }

      removedMembers.push(userId);

      // Log Activity
      await ActivityLog.create({
        userId: requestingUserId,
        projectId,
        action: 'MEMBER_REMOVED',
        entityType: 'MEMBER',
        entityId: userId,
      });

      // Notify User
      const notification = await Notification.create({
        userId,
        projectId,
        message: `You have been removed from project: ${project?.title || 'Project'}`,
      });

      getIO().to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });
    }

    // remaining members + removed users (important)
    await Promise.all([
      invalidateProjectCacheForProjectMembers(projectId),
      invalidateProjectCacheForUsers(removedMembers, projectId),
    ]);

    res.json({
      message: 'Members processed',
      removedMembers,
      skippedMembers,
    });
  } catch (error) {
    console.log('Error removing members:', error);
    res
      .status(500)
      .json({ message: 'Internal server error while removing members' });
  }
};


export const updateMemberRole = async (req, res) => {
  const { id: projectId, userId } = req.params;
  const { role } = req.body;

  try {
    const requestingUserId = req.user.id;

    const allowedRoles = ['OWNER', 'MEMBER'];
    if (!allowedRoles.includes(role)) {
      return res
        .status(400)
        .json({ message: 'Invalid role. Allowed roles are OWNER and MEMBER' });
    }

    if (!req.user.isAdmin) {
      const requestingMember = await ProjectMember.findOne({
        userId: requestingUserId,
        projectId,
      });
      if (!requestingMember || requestingMember.role !== 'OWNER') {
        return res
          .status(403)
          .json({ message: 'Only project owners can update member roles' });
      }
    }

    const member = await ProjectMember.findOne({ userId, projectId });
    if (!member) {
      return res
        .status(404)
        .json({ message: 'Member not found in this project' });
    }

    if (userId === requestingUserId && role !== 'OWNER') {
      return res
        .status(400)
        .json({ message: 'Owner cannot demote themselves' });
    }

    member.role = role;
    await member.save();

    await ActivityLog.create({
      userId: requestingUserId,
      projectId,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'MEMBER',
      entityId: userId,
    });

    const project = await Project.findById(projectId);
    const notification = await Notification.create({
      userId,
      projectId,
      message: `Your role in project "${project?.title || 'Project'}" has been updated to ${role}.`,
    });

    const io = getIO();
    io.to(`user:${userId}`).emit('NOTIFICATION_NEW', { notification });

    // centralized cache invalidation
    await invalidateProjectCacheForProjectMembers(projectId);

    res.json({ message: 'Member role updated successfully', member });
  } catch (error) {
    console.log('Error Occured While Updating Member Role : ', error);
    res
      .status(500)
      .json({ message: 'Internal server error while updating member role' });
  }
};
