/**
 * Import business data from JSON files exported by export-data.js.
 *
 * Run on the production server AFTER seed-reference.js has been run:
 *   docker compose exec -T server node scripts/import-data.js
 *
 * Expects JSON files at /app/data-export/<collection>.json inside the container.
 * Map the data-export folder from the host into the container first:
 *   docker compose run --rm -v ~/oms/data-export:/app/data-export server node scripts/import-data.js
 *
 * OR copy the files into the running container:
 *   docker compose cp ~/oms/data-export/. server:/app/data-export/
 *   docker compose exec -T server node scripts/import-data.js
 *
 * Strategy: upsert by _id so it's safe to re-run.
 * Users collection: skips any user that already exists (preserves passwords set by create-admin.js).
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

// Look for data-export in /app/data-export (Docker) or ../data-export (local)
const DATA_DIR = fs.existsSync('/app/data-export')
  ? '/app/data-export'
  : resolve(__dirname, '../data-export');

if (!fs.existsSync(DATA_DIR)) {
  console.error(`data-export directory not found at: ${DATA_DIR}`);
  console.error('Copy the data-export/ folder from your local machine to the server first.');
  process.exit(1);
}

const COLLECTIONS = [
  'employees',
  'users',
  'claims',
  'cases',
  'settlements',
  'settlementledgers',
  'settlementclaimitems',
  'settlementpayments',
  'visarenewals',
  'resignations',
  'b2bpartners',
];

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: 'office_manage_system' });
  console.log('Connected to MongoDB (office_manage_system)\n');

  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  ${col}: SKIP — ${filePath} not found`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!docs.length) {
      console.log(`  ${col}: 0 documents (skipping)`);
      continue;
    }

    // For users, skip existing usernames to preserve passwords set by create-admin.js
    if (col === 'users') {
      const existing = await db.collection(col).find({}, { projection: { username: 1 } }).toArray();
      const existingUsernames = new Set(existing.map(u => u.username));
      const toInsert = docs.filter(d => !existingUsernames.has(d.username));
      if (toInsert.length === 0) {
        console.log(`  ${col}: all ${docs.length} users already exist — skipped`);
        continue;
      }
      // Convert string _id back to ObjectId
      const prepared = toInsert.map(d => ({
        ...d,
        _id: new mongoose.Types.ObjectId(d._id.toString().replace(/^ObjectId\(["']?|["']?\)$/g, ''))
      }));
      try {
        await db.collection(col).insertMany(prepared, { ordered: false });
        console.log(`  ${col}: inserted ${toInsert.length}/${docs.length} users (skipped ${docs.length - toInsert.length} existing)`);
      } catch (e) {
        console.log(`  ${col}: inserted with some duplicates skipped — ${e.message.split('\n')[0]}`);
      }
      continue;
    }

    // All other collections: upsert by _id
    const ops = docs.map(doc => {
      let id;
      try {
        const raw = doc._id?.$oid || doc._id?.toString() || doc._id;
        id = new mongoose.Types.ObjectId(raw);
      } catch {
        id = doc._id;
      }
      return {
        replaceOne: {
          filter: { _id: id },
          replacement: { ...doc, _id: id },
          upsert: true,
        },
      };
    });

    try {
      const result = await db.collection(col).bulkWrite(ops, { ordered: false });
      const ins = result.upsertedCount || 0;
      const upd = result.modifiedCount || 0;
      console.log(`  ${col}: ${ins} inserted, ${upd} updated (${docs.length} total)`);
    } catch (e) {
      console.error(`  ${col}: ERROR — ${e.message}`);
    }
  }

  console.log('\nImport complete.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
