import File from '../models/File.js';
import * as messageService from '../service/messageService.js';
import { uploadToCloudinary } from '../utils/cloudinary.utils.js';

export const registerChatHandlers = (io, socket) => {
  // chat:send event
  socket.on('chat:send', async (data) => {
    try {
      const { projectId, content } = data;

      if (!projectId || !content) {
        return;
      }
      // Room Validate
      const room = `project:${projectId}`;
      if (!socket.rooms.has(room)) {
        console.warn(
          `User ${socket.user.id} attempted to send message to project ${projectId} without being a member.`,
        );
        return;
      }

      // Process Attachments if any
      const attachmentIds = [];
      if (data.attachments && Array.isArray(data.attachments)) {
        for (const fileData of data.attachments) {
          // It must have base64 data for upload
          if(!fileData.base64) {
            console.log('Attachment skipped due to missing base64 data:', fileData);
            continue;
          }
          const uploadResult = await uploadToCloudinary(fileData.base64);
          
          const fileRecord = await File.create({
            projectId,
            uploadedBy: socket.user.id,
            originalName: fileData.originalName || 'unnamed',
            storageName: uploadResult.public_id,
            url: uploadResult.secure_url,
            mimeType: fileData.mimeType || uploadResult.format,
            size: fileData.size || uploadResult.bytes,
          });
          
          attachmentIds.push(fileRecord._id);
        }
      }

      // Save message to DB
      const message = await messageService.saveMessage(
        projectId,
        socket.user.id,
        content,
        attachmentIds,
      );
      // console.log(message)
      
      // Broadcast message to Room
      io.to(room).emit('chat:receive', message);
    } catch (error) {
      console.error('Error in chat:send handler:', error);
    }
  });

  // Typing indicators (Ephemeral)
  socket.on('chat:typing:start', (projectId) => {
    socket.to(`project:${projectId}`).emit('chat:typing:start', {
      userId: socket.user.id,
      projectId,
    });
  });

  socket.on('chat:typing:stop', (projectId) => {
    socket.to(`project:${projectId}`).emit('chat:typing:stop', {
      userId: socket.user.id,
      projectId,
    });
  });

  // chat:edit event
  socket.on('chat:edit', async (data) => {
    try {
      const { messageId, content, projectId } = data;

      if (!messageId || !content || !projectId) {
        return;
      }

      // Validate room membership
      const room = `project:${projectId}`;
      if (!socket.rooms.has(room)) {
        return;
      }

      // Update message in DB
      const message = await messageService.editMessage(
        messageId,
        socket.user.id,
        content,
      );

      if (message) {
        // Broadcast update to Room
        io.to(room).emit('chat:edit', message);
      }
    } catch (error) {
      console.error('Error in chat:edit handler:', error);
    }
  });

  // chat:delete event
  socket.on('chat:delete', async (data) => {
    try {
      const { messageId, projectId } = data;

      if (!messageId || !projectId) {
        return;
      }

      // Validate room membership
      const room = `project:${projectId}`;
      if (!socket.rooms.has(room)) {
        return;
      }

      // Soft delete
      const message = await messageService.deleteMessage(
        messageId,
        socket.user.id,
      );

      if (message) {
        // Broadcast deletion
        io.to(room).emit('chat:delete', { messageId, projectId });
      }
    } catch (error) {
      console.error('Error in chat:delete handler:', error);
    }
  });
};
