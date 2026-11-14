/**
 * Admin-only routes — data import utility.
 * Protected by verifyToken + requireRole('admin').
 */
import express from 'express';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/admin/import
// Body: { collection: string, docs: object[] }
// Upserts all docs by _id. Returns counts.
router.post('/import', requireRole('admin'), async (req, res) => {
  try {
    const { collection, docs } = req.body;

    const ALLOWED = [
      'employees', 'users', 'claims', 'cases',
      'settlements', 'settlementledgers', 'settlementclaimitems',
      'settlementpayments', 'visarenewals', 'resignations', 'b2bpartners',
    ];

    if (!ALLOWED.includes(collection)) {
      return res.status(400).json({ error: `Collection "${collection}" not allowed` });
    }
    if (!Array.isArray(docs) || docs.length === 0) {
      return res.json({ upserted: 0, modified: 0, skipped: 0 });
    }

    const db = mongoose.connection.db;

    // For users: skip existing usernames to preserve current passwords
    if (collection === 'users') {
      const existing = await db.collection('users')
        .find({}, { projection: { username: 1 } }).toArray();
      const taken = new Set(existing.map(u => u.username));
      const toInsert = docs.filter(d => !taken.has(d.username));
      if (toInsert.length === 0) {
        return res.json({ upserted: 0, modified: 0, skipped: docs.length });
      }
      const prepared = toInsert.map(d => ({
        ...d,
        _id: toObjectId(d._id),
      }));
      try {
        await db.collection('users').insertMany(prepared, { ordered: false });
      } catch (_) {}
      return res.json({ upserted: toInsert.length, modified: 0, skipped: docs.length - toInsert.length });
    }

    const ops = docs.map(doc => ({
      replaceOne: {
        filter: { _id: toObjectId(doc._id) },
        replacement: { ...doc, _id: toObjectId(doc._id) },
        upsert: true,
      },
    }));

    const result = await db.collection(collection).bulkWrite(ops, { ordered: false });
    res.json({
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      skipped: 0,
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

function toObjectId(id) {
  if (!id) return new mongoose.Types.ObjectId();
  try {
    const raw = id?.$oid ?? id?.toString?.() ?? id;
    return new mongoose.Types.ObjectId(String(raw).replace(/^ObjectId\(["']?|["']?\)$/g, ''));
  } catch {
    return new mongoose.Types.ObjectId();
  }
}

export default router;
