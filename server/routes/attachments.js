import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Case from '../models/Case.js';
import { verifyToken } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import { addHistory, timestamp } from '../utils/caseHelpers.js';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// §1-13 添付ファイル管理機能
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 最大5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('PDF・PNG・JPG のみアップロードできます'));
    }
    cb(null, true);
  },
});

// 1件の案件に複数のファイルを添付できる
router.post(
  '/:caseId/attachments',
  verifyToken,
  requirePermission(PERMISSIONS.EDIT),
  upload.array('files', 10),
  async (req, res) => {
    try {
      const found = await Case.findOne({ caseId: req.params.caseId });
      if (!found) return res.status(404).json({ error: '案件が見つかりません' });

      // kinds は files と同じ並びで送る（例：["領収書","配送伝票"]）
      const kinds = req.body.kinds
        ? (Array.isArray(req.body.kinds) ? req.body.kinds : JSON.parse(req.body.kinds))
        : [];

      (req.files || []).forEach((file, i) => {
        found.attachments.push({
          name: file.originalname,
          kind: kinds[i] || 'その他',
          storedName: file.filename,
          size: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user.username,
          uploadedAt: timestamp(),
        });
        addHistory(found, {
          by: req.user.username,
          action: '添付追加',
          field: '添付書類',
          before: '',
          after: file.originalname,
        });
      });

      // 天引き誓約書が添付されたら退職時の管理へ反映する §1-11
      if (found.resignation && found.attachments.some((a) => a.kind === '天引き誓約書')) {
        found.resignation.pledgeAttached = true;
      }

      await found.save();
      res.status(201).json(found);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// 添付ファイルの閲覧（権限が必要）
router.get(
  '/:caseId/attachments/:storedName',
  verifyToken,
  requirePermission(PERMISSIONS.VIEW_ATTACHMENT),
  async (req, res) => {
    try {
      const found = await Case.findOne({ caseId: req.params.caseId });
      if (!found) return res.status(404).json({ error: '案件が見つかりません' });

      const attachment = found.attachments.find((a) => a.storedName === req.params.storedName);
      if (!attachment) return res.status(404).json({ error: '添付ファイルが見つかりません' });

      const filePath = path.join(UPLOAD_DIR, attachment.storedName);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'ファイルの実体が見つかりません' });

      res.type(attachment.mimeType);
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 添付ファイルの削除
router.delete(
  '/:caseId/attachments/:storedName',
  verifyToken,
  requirePermission(PERMISSIONS.EDIT),
  async (req, res) => {
    try {
      const found = await Case.findOne({ caseId: req.params.caseId });
      if (!found) return res.status(404).json({ error: '案件が見つかりません' });

      const attachment = found.attachments.find((a) => a.storedName === req.params.storedName);
      if (!attachment) return res.status(404).json({ error: '添付ファイルが見つかりません' });

      found.attachments = found.attachments.filter((a) => a.storedName !== req.params.storedName);
      addHistory(found, {
        by: req.user.username,
        action: '添付削除',
        field: '添付書類',
        before: attachment.name,
        after: '',
      });
      await found.save();

      const filePath = path.join(UPLOAD_DIR, attachment.storedName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      res.json(found);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
