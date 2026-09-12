import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types and their corresponding extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|pdf)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitise original filename: strip path traversal and special chars
    const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeOriginal);
  }
});

/**
 * Extension + MIME type filter (first pass, before the file is written to disk).
 * A second magic-byte check runs after upload.
 */
const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), { code: 'INVALID_FILE_TYPE' }),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB per file
    files: 10,                   // max 10 files per request
  },
});

// Use multer's callback pattern — compatible with Express v5 + multer v2.
// The old router-level (err, req, res, next) pattern is unreliable in this stack.
router.post('/', (req, res) => {
  upload.array('files', 10)(req, res, async (err) => {
    // Handle multer-level errors inline (file size, type, count limits)
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 2 MB per file.' });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: err.message });
      }
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message || 'Upload error.' });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      // Second-pass: magic-byte validation using the file-type package
      const results = await Promise.all(
        req.files.map(async (file) => {
          const buffer = fs.readFileSync(file.path);
          const detected = await fileTypeFromBuffer(buffer);

          // PDFs start with "%PDF" — file-type returns 'application/pdf'
          // For PDFs that file-type can't detect, fall back to extension check
          const isValidMagic =
            (detected && ALLOWED_MIME_TYPES.has(detected.mime)) ||
            (!detected && /\.pdf$/i.test(file.originalname)); // text-based PDFs

          if (!isValidMagic) {
            // Delete the suspicious file immediately
            fs.unlinkSync(file.path);
            return { filename: file.originalname, error: 'File content does not match its extension.' };
          }

          return { filename: file.filename, ok: true };
        })
      );

      const failed = results.filter((r) => r.error);
      const succeeded = results.filter((r) => r.ok).map((r) => r.filename);

      if (failed.length > 0 && succeeded.length === 0) {
        return res.status(400).json({ message: 'All uploaded files failed validation.', failed });
      }

      const response = { message: 'Files uploaded successfully', fileNames: succeeded };
      if (failed.length > 0) response.warnings = failed;

      res.json(response);
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Error uploading files' });
    }
  });
});

export default router;


