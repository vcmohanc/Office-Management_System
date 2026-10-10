import './config/env.js';        // MUST be first — loads .env before any other module
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import employeeRoutes from './routes/employees.js';
import caseRoutes from './routes/cases.js';
import claimRoutes from './routes/claims.js';
import optionRoutes from './routes/options.js';
import b2bRoutes from './routes/b2b.js';
import expenseRoutes from './routes/expenses.js';
import regionRoutes from './routes/regions.js';
import uploadRoutes from './routes/upload.js';
import settlementRoutes from './routes/settlements.js';
import staffRoutes from './routes/staff.js';
import resignationRoutes from './routes/resignations.js';
import { verifyToken, verifyFileToken } from './middleware/auth.js';
import { sseHandler } from './events.js';
import fs from 'fs';
import { compressionMiddleware } from './middleware/compression.js';


import path from 'path';
import { fileURLToPath } from 'url';


import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,              // 1000 requests per 15 mins per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Add Comprehensive Security Headers (CSP, Frameguard, Referrer-Policy)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "http:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"]
    }
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Restrict CORS securely (disallow credentials with wildcard)
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(o => o.trim()) 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use('/api', apiLimiter);
app.use(express.json());
app.use(compressionMiddleware);

// Force UTF-8 charset on all responses
app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Authenticated file serving — replaces the public express.static for /uploads.
// Supports token via Authorization header OR ?token= query param so that
// browser <a href> and <img src> links (which can't set headers) still work.
app.get('/api/uploads/:filename', verifyFileToken, (req, res) => {
  const safeFile = path.basename(req.params.filename); // strip any path traversal
  const filePath = path.join(__dirname, 'uploads', safeFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Prevent token leakage via Referer and sandbox file rendering (SEC-HIGH-02, SEC-HIGH-03)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

  res.sendFile(filePath);
});

// Public routes — no token required
app.use('/api/auth', authRoutes);

// Protected routes — valid JWT required for all routes below
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/employees', verifyToken, employeeRoutes);
app.use('/api/staff', verifyToken, staffRoutes);
app.use('/api/cases', verifyToken, caseRoutes);
app.use('/api/claims', verifyToken, claimRoutes);
app.use('/api/options', verifyToken, optionRoutes);
app.use('/api/b2b', verifyToken, b2bRoutes);
app.use('/api/expenses', verifyToken, expenseRoutes);
app.use('/api/regions', verifyToken, regionRoutes);
app.use('/api/upload', verifyToken, uploadRoutes);
app.use('/api/settlements', verifyToken, settlementRoutes);
app.use('/api/resignations', verifyToken, resignationRoutes);

// SSE endpoint for real-time synchronization
app.get('/api/events', verifyFileToken, sseHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });
