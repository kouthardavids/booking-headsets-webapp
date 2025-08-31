import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CLIENT_URL
            : "http://localhost:5006",
        methods: ["GET", "POST"]
    }
});

// Track the connected users
const connectedUsers = new Map();

// Handling the connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Track authenticated users
    socket.on('user_connected', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Handle headset booking
    socket.on('headset_booked', (data) => {
        io.emit('headset_availability_update', data);
    });

    // Handle headset return
    socket.on('headset_returned', (data) => {
        io.emit('headset_availability_update', data);
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});


export { io, server, app };