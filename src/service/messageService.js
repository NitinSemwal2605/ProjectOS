import ActivityLog from "../models/ActivityLog.js";
import Message from "../models/Message.js";

export const saveMessage = async (projectId, senderId, content) => {
    const message = await Message.create({
        projectId,
        senderId,
        content,
    });

    await ActivityLog.create({
        userId: senderId,
        projectId,
        action: "MESSAGE_SENT",
        entityType: "MESSAGE",
        entityId: message._id,
        metadata: { contentSummary: content.substring(0, 50) },
    });

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
        .populate("senderId", "name email ");

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
    const message = await Message.findOneAndUpdate(
        { _id: messageId, senderId: userId, deletedAt: null },
        {
            content,
            editedAt: new Date(),
        },
        { new: true }
    );

    if (message) {
        await ActivityLog.create({
            userId,
            projectId: message.projectId,
            action: "MESSAGE_EDITED",
            entityType: "MESSAGE",
            entityId: message._id,
            metadata: { messageId },
        });
    }

    return message;
};


export const deleteMessage = async (messageId, userId) => {
    const message = await Message.findOneAndUpdate(
        { _id: messageId, senderId: userId, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (message) {
        await ActivityLog.create({
            userId,
            projectId: message.projectId,
            action: "MESSAGE_DELETED",
            entityType: "MESSAGE",
            entityId: message._id,
            metadata: { messageId },
        });
    }

    return message;
};
