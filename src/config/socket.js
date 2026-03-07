import { Server } from 'socket.io';
import ProjectMember from '../models/ProjectMember.js';
import { registerChatHandlers } from '../socket/chatHandler.js';
import { socketAuthMiddleware } from '../socket/socketAuth.middleware.js';

let io;
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`Socket Connected: ${socket.id} (User: ${userId})`);

    try {
      // Join personal room for Notifications
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined notification room: user:${userId}`);

      // Join All Project Rooms of User
      const memberships = await ProjectMember.find({ userId });
      memberships.forEach((membership) => {
        const room = `project:${membership.projectId}`;
        console.log('Joining room:', room);
        socket.join(room);
        console.log(`User ${userId} joined project room: ${room}`);
      });

      // Register Chat Handlers
      registerChatHandlers(io, socket);
    } catch (error) {
      console.error('Error in socket connection setup:', error);
    }

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
