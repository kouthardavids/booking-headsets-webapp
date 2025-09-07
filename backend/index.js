import { server, app, io } from './websocketServer.js';
import authRoutes from './routes/authRoutes.js';
import headsetRoutes from './routes/headsetRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();

// CORS middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true
}));


// Adds middleware
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/headsets', headsetRoutes);
app.use('/api/requests', requestRoutes);

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});