require('dotenv').config();
const path = require('path');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
// express-mongo-sanitize tries to reassign req.query which is read-only in Node 22+
// Inline sanitizer that only touches req.body (safe on all Node versions)
const stripDollarKeys = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      stripDollarKeys(obj[key]);
    }
  }
};
const mongoSanitize = () => (req, _res, next) => {
  if (req.body && typeof req.body === 'object') stripDollarKeys(req.body);
  next();
};
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { setupSocket } = require('./config/socket');

// Routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const parcelRoutes = require('./routes/parcels');
const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');
const otpRoutes = require('./routes/otp');
const kycRoutes = require('./routes/kyc');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const httpServer = createServer(app);

// Origins that are always allowed regardless of FRONTEND_URL:
// - Capacitor Android WebView uses http://localhost
// - Capacitor iOS uses capacitor://localhost or ionic://localhost
// - No origin = native mobile HTTP clients (axios from inside WebView)
const CAPACITOR_ORIGINS = [
  'http://localhost',
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost',
];

const corsOriginFn = (origin, callback) => {
  const allowed = process.env.FRONTEND_URL || '*';
  // Allow requests with no origin (Capacitor native HTTP, curl, server-to-server)
  if (!origin) return callback(null, true);
  // Always allow Capacitor/Ionic WebView origins (Android & iOS app)
  if (CAPACITOR_ORIGINS.includes(origin)) return callback(null, true);
  // Allow wildcard or specific configured origin
  if (allowed === '*' || origin === allowed) return callback(null, true);
  // Allow any origin listed in comma-separated FRONTEND_URL
  const list = allowed.split(',').map(s => s.trim());
  if (list.includes(origin) || list.includes('*')) return callback(null, true);
  // Default: allow (MVP — tighten after launch)
  callback(null, true);
};

const io = new Server(httpServer, {
  cors: { origin: corsOriginFn, methods: ['GET', 'POST'] },
});

// Connect DB
connectDB();

// CORS must be first so OPTIONS preflight gets Allow-Origin before rate limiters
app.use(cors({ origin: corsOriginFn }));

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Body parsing BEFORE sanitization so req.body is a plain object when sanitizer runs
app.use(express.json({ limit: '1mb' }));

// NoSQL injection prevention (runs after json() so req.body is defined)
app.use(mongoSanitize());

// General rate limit: 100 requests per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Strict limit on auth: 20 attempts per hour per IP (5 was too low for dev/testing)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/verify', authLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/otp', otpRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

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
