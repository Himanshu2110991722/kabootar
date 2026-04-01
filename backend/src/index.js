require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { setupSocket } = require('./config/socket');

// Routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const parcelRoutes = require('./routes/parcels');
const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Attach io to req
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'kabootar' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Setup socket
setupSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🕊️  Kabootar backend running on port ${PORT}`);
});
