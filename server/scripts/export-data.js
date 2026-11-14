/**
 * Export all business data from local MongoDB to JSON files.
 *
 * Run from the server/ directory (or project root):
 *   node scripts/export-data.js
 *
 * Creates: server/data-export/<collection>.json for each collection.
 * Skips reference collections that are managed by seed-reference.js
 * (Option, Region, PostalCharge, TravelCharge).
 *
 * Copy the entire data-export/ folder to the server, then run import-data.js.
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
  console.error('MONGO_URI not set in server/.env');
  process.exit(1);
}

const OUT_DIR = resolve(__dirname, '../data-export');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Collections to export (business data)
// Reference data (Option, Region, PostalCharge, TravelCharge) is managed by seed-reference.js
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
  const summary = [];

  for (const col of COLLECTIONS) {
    const docs = await db.collection(col).find({}).toArray();
    const outFile = path.join(OUT_DIR, `${col}.json`);
    fs.writeFileSync(outFile, JSON.stringify(docs, null, 2), 'utf-8');
    console.log(`  ${col}: ${docs.length} documents → ${outFile}`);
    summary.push({ collection: col, count: docs.length });
  }

  console.log('\nExport complete.');
  console.log(`Files written to: ${OUT_DIR}`);
  console.log('\nNext steps:');
  console.log('  1. Copy the data-export/ folder to the server:');
  console.log('     scp -i <your-key.pem> -r server/data-export ubuntu@13.159.83.241:~/oms/data-export');
  console.log('  2. On the server, run the import script:');
  console.log('     docker compose exec -T server node scripts/import-data.js');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
