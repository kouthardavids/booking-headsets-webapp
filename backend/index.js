import { server, app, io } from './websocketServer.js';
import authRoutes from './routes/authRoutes.js';
import headsetRoutes from './routes/headsetRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ["http://localhost:5006", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

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

const PORT = process.env.PORT || 5006;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});