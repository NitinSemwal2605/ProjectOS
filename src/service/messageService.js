import { getIO } from '../config/socket.js';
import ActivityLog from '../models/ActivityLog.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import ProjectMember from '../models/ProjectMember.js';
import User from '../models/User.js';
import { parseMentions } from '../utils/mention.utils.js';

export const saveMessage = async (projectId, senderId, content, attachments = []) => {
  const message = await Message.create({
    projectId,
    senderId,
    content,
    attachments,
  });

  await ActivityLog.create({
    userId: senderId,
    projectId,
    action: 'MESSAGE_SENT',
    entityType: 'MESSAGE',
    entityId: message._id,
    metadata: { contentSummary: content.substring(0, 50) },
  });

  // Handle @Mentions
  const mentionedUser = parseMentions(content);
  if (mentionedUser.length > 0) {
    const mentionedUsers = await User.find({
      username: { $in: mentionedUser },
    }).select('_id username');

    const mentionedUserIds = mentionedUsers.map((u) => u._id);

    // Project Membership Check
    const members = await ProjectMember.find({
      projectId,
      userId: { $in: mentionedUserIds },
    });

    const validMentionedUserIds = members.map((m) => m.userId.toString());

    if (validMentionedUserIds.length > 0) {
      const sender = await User.findById(senderId).select('username'); // returns a 
      
      const notifications = validMentionedUserIds
        .filter((uid) => uid !== senderId.toString()) // Don't notify self
        .map((uid) => ({
          userId: uid,
          projectId: projectId,
          message: `${sender.username} mentioned you in a message.`,
        }));

      if (notifications.length > 0) {
        const savedNotifications = await Notification.insertMany(notifications);

        // Real-time notification via Socket.io
        const io = getIO();
        savedNotifications.forEach((notif) => {
          io.to(`user:${notif.userId}`).emit('NOTIFICATION_NEW', {
            notification: notif,
          });
        });
      }
    }
  }

  return message;
};

export const getProjectMessages = async (projectId, limit = 50, offset = 0) => {
  const messages = await Message.find({
    projectId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .populate('senderId', 'name email ');

  const total = await Message.countDocuments({
    projectId,
    deletedAt: null,
  });

  return {
    messages: messages.reverse(),
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  };
};

export const editMessage = async (messageId, userId, content) => {
  // Updated Document
  const message = await Message.findOneAndUpdate(
    { _id: messageId, senderId: userId, deletedAt: null },
    {
      content,
      editedAt: new Date(),
    },
    { new: true },
  );

  if (message) {
    await ActivityLog.create({
      userId,
      projectId: message.projectId,
      action: 'MESSAGE_EDITED',
      entityType: 'MESSAGE',
      entityId: message._id,
      metadata: { messageId },
    });
  }

  return message;
};

export const deleteMessage = async (messageId, userId, isAdmin = false) => {
  const query = { _id: messageId, deletedAt: null };
  if (!isAdmin) {
    query.senderId = userId;
  }
  const message = await Message.findOneAndUpdate(
    query,
    { deletedAt: new Date() },
    { new: true },
  );

  if (message) {
    await ActivityLog.create({
      userId,
      projectId: message.projectId,
      action: 'MESSAGE_DELETED',
      entityType: 'MESSAGE',
      entityId: message._id,
      metadata: { messageId },
    });
  }

  return message;
};
