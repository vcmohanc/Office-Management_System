import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import caseRoutes from './routes/cases.js';
import attachmentRoutes from './routes/attachments.js';
import masterRoutes from './routes/masters.js';
import exportRoutes from './routes/exports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/cases', attachmentRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/exports', exportRoutes);

// アップロードのサイズ超過など、multer が投げるエラーを日本語で返す
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ファイルサイズは5MBまでです' });
  }
  res.status(400).json({ error: err.message || 'リクエストの処理に失敗しました' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB に接続できませんでした:', err.message);
    console.error('MongoDB が起動しているか確認してください（管理者権限のPowerShellで Start-Service MongoDB）。');
    console.error('接続先は MONGO_URI 環境変数、既定では mongodb://localhost:27017/office_manage_system です。');
    process.exit(1);
  });
