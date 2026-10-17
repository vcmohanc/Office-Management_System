/**
 * Export local reference collections (Options, Regions, PostalCharges, TravelCharges)
 * to JSON seed files in server/seeds/.
 *
 * Run from the server directory:
 *   node scripts/export-reference.js
 *
 * Requires MONGO_URI in server/.env (or set in shell).
 * Output: server/seeds/{options,regions,postalcharges,travelcharges}.json
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
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

const SEEDS_DIR = resolve(__dirname, '../seeds');

// ── Models (inline to avoid import-path issues) ─────────────────────────────

const Option = mongoose.model('Option', new mongoose.Schema({
  type: String, label: String, value: String
}, { timestamps: true }));

const Region = mongoose.model('Region', new mongoose.Schema({
  name1: String, name2: String
}, { timestamps: true }));

const PostalCharge = mongoose.model('PostalCharge', new mongoose.Schema({
  departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  charges: { type: Map, of: String }
}, { timestamps: true }));

const TravelCharge = mongoose.model('TravelCharge', new mongoose.Schema({
  departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  charges: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true }));

// ── Helpers ──────────────────────────────────────────────────────────────────

function write(filename, data) {
  fs.mkdirSync(SEEDS_DIR, { recursive: true });
  const filepath = path.join(SEEDS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Wrote ${data.length} documents → seeds/${filename}`);
}

// ── Export ────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  // 1. Options — no cross-references
  const options = await Option.find({}).lean();
  write('options.json', options.map(({ type, label, value }) => ({ type, label, value })));

  // 2. Regions — no cross-references
  const regions = await Region.find({}).lean();
  write('regions.json', regions.map(({ name1, name2 }) => ({ name1, name2 })));

  // Build lookup maps: ObjectId string → name
  const idToName1 = {};
  const idToName2 = {};
  for (const r of regions) {
    idToName1[r._id.toString()] = r.name1;
    idToName2[r._id.toString()] = r.name2;
  }

  // 3. PostalCharges — denormalize ObjectId references to names
  const postalRaw = await PostalCharge.find({}).lean();
  const postalExport = postalRaw.map(pc => {
    const departure_name1 = idToName1[pc.departure?.toString()] || null;
    const charges = {};
    const rawCharges = pc.charges instanceof Map ? Object.fromEntries(pc.charges) : pc.charges;
    for (const [destId, amount] of Object.entries(rawCharges || {})) {
      const destName2 = idToName2[destId];
      if (destName2) charges[destName2] = amount;
    }
    return { departure_name1, charges };
  }).filter(pc => pc.departure_name1);
  write('postalcharges.json', postalExport);

  // 4. TravelCharges — same pattern
  const travelRaw = await TravelCharge.find({}).lean();
  const travelExport = travelRaw.map(tc => {
    const departure_name1 = idToName1[tc.departure?.toString()] || null;
    const charges = {};
    const rawCharges = tc.charges instanceof Map ? Object.fromEntries(tc.charges) : tc.charges;
    for (const [destId, amount] of Object.entries(rawCharges || {})) {
      const destName2 = idToName2[destId];
      if (destName2) charges[destName2] = amount;
    }
    return { departure_name1, charges };
  }).filter(tc => tc.departure_name1);
  write('travelcharges.json', travelExport);

  console.log('\nExport complete. Commit server/seeds/*.json to push to production.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
