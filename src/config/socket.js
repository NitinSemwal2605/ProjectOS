import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth.middleware.js";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        console.log(`Socket Connected: ${socket.id} (User: ${socket.user?.id})`);

        // Join personal room
        if (socket.user?.id) {
            socket.join(`user:${socket.user.id}`);
        }

        // Handle joining project rooms
        socket.on("joinProject", (projectId) => {
            socket.join(`project:${projectId}`);
            console.log(`User ${socket.user.id} joined project room: project:${projectId}`);
        });

        socket.on("leaveProject", (projectId) => {
            socket.leave(`project:${projectId}`);
            console.log(`User ${socket.user.id} left project room: project:${projectId}`);
        });

        socket.on("disconnect", () => {
            console.log(`Socket Disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
