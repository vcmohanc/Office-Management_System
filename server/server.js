import './config/env.js';        // MUST be first — loads .env before any other module
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
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
import { verifyToken, verifyFileToken } from './middleware/auth.js';
import fs from 'fs';


import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// Authenticated file serving — replaces the public express.static for /uploads.
// Supports token via Authorization header OR ?token= query param so that
// browser <a href> and <img src> links (which can't set headers) still work.
app.get('/uploads/:filename', verifyFileToken, (req, res) => {
  const safeFile = path.basename(req.params.filename); // strip any path traversal
  const filePath = path.join(__dirname, 'uploads', safeFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

// Public routes — no token required
app.use('/api/auth', authRoutes);

// Protected routes — valid JWT required for all routes below
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/employees', verifyToken, employeeRoutes);
app.use('/api/cases', verifyToken, caseRoutes);
app.use('/api/claims', verifyToken, claimRoutes);
app.use('/api/options', verifyToken, optionRoutes);
app.use('/api/b2b', verifyToken, b2bRoutes);
app.use('/api/expenses', verifyToken, expenseRoutes);
app.use('/api/regions', verifyToken, regionRoutes);
app.use('/api/upload', verifyToken, uploadRoutes);

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
