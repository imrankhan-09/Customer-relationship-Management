const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { connectDB } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const locationRoutes = require('./routes/locationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connect to Database
connectDB();

// Socket.io Connection Logic
const userSockets = new Map(); // userId -> [socketId1, socketId2, ...]

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      if (!userSockets.has(String(userId))) {
        userSockets.set(String(userId), []);
      }
      userSockets.get(String(userId)).push(socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, sockets] of userSockets.entries()) {
      const index = sockets.indexOf(socket.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) userSockets.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to send real-time notification
const sendRealTimeNotification = (receiverId, notification) => {
  const sockets = userSockets.get(String(receiverId));
  if (sockets && sockets.length > 0) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('new_notification', notification);
    });
  }
};

// Make io and helper available to req
app.use((req, res, next) => {
  req.io = io;
  req.sendNotification = sendRealTimeNotification;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('CRM Backend Running with Socket.io Support');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
