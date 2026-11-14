/**
 * Push exported data to the live server via the admin API.
 *
 * Usage (from server/ directory):
 *   ADMIN_PASSWORD=<password> node scripts/push-to-server.js
 *
 * Or set SERVER_URL and ADMIN_USER / ADMIN_PASSWORD as environment variables.
 * Reads JSON files from ./data-export/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SERVER_URL = process.env.SERVER_URL || 'https://oms.vegecoop.net';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  console.error('Set ADMIN_PASSWORD env var: ADMIN_PASSWORD=<password> node scripts/push-to-server.js');
  process.exit(1);
}

const DATA_DIR = path.resolve(__dirname, '../data-export');
if (!fs.existsSync(DATA_DIR)) {
  console.error('data-export/ not found. Run export-data.js first.');
  process.exit(1);
}

const COLLECTIONS = [
  'employees',
  'resignations',
  'b2bpartners',
  'claims',
  'cases',
  'settlements',
  'settlementledgers',
  'settlementclaimitems',
  'settlementpayments',
  'visarenewals',
];

async function login() {
  const res = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.token) throw new Error('No token in login response');
  return data.token;
}

async function pushCollection(token, collection, docs) {
  const BATCH = 100;
  let totalUpserted = 0;
  let totalModified = 0;
  let totalSkipped = 0;

  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    const res = await fetch(`${SERVER_URL}/api/admin/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ collection, docs: batch }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Import ${collection} failed (${res.status}): ${text}`);
    }
    const { upserted = 0, modified = 0, skipped = 0 } = await res.json();
    totalUpserted += upserted;
    totalModified += modified;
    totalSkipped += skipped;
  }

  return { upserted: totalUpserted, modified: totalModified, skipped: totalSkipped };
}

async function run() {
  console.log(`Connecting to ${SERVER_URL} as "${ADMIN_USER}"...`);
  const token = await login();
  console.log('Logged in.\n');

  for (const col of COLLECTIONS) {
    const file = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  ${col}: SKIP (file not found)`);
      continue;
    }
    const docs = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (docs.length === 0) {
      console.log(`  ${col}: 0 docs — skipped`);
      continue;
    }
    const { upserted, modified, skipped } = await pushCollection(token, col, docs);
    console.log(`  ${col}: ${upserted} inserted, ${modified} updated, ${skipped} skipped (${docs.length} total)`);
  }

  console.log('\nDone! Refresh the app — data should now appear.');
}

run().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
