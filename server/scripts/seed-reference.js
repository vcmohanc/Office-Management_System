/**
 * Import reference data from server/seeds/ JSON files into MongoDB.
 * Safe to re-run — uses upsert for Options and Regions, replaces charges.
 *
 * Run locally:
 *   node scripts/seed-reference.js
 *
 * Run on production server (inside Docker):
 *   docker compose exec server node scripts/seed-reference.js
 *
 * Requires MONGO_URI in environment (server/.env or docker-compose env).
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

// ── Models ───────────────────────────────────────────────────────────────────

const Option = mongoose.model('Option', new mongoose.Schema({
  type: String, label: String, value: String
}, { timestamps: true }));

const Region = mongoose.model('Region', new mongoose.Schema({
  name1: String, name2: String
}, { timestamps: true }));

const PostalCharge = mongoose.model('PostalCharge', new mongoose.Schema({
  departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', unique: true },
  charges: { type: Map, of: String }
}, { timestamps: true }));

const TravelCharge = mongoose.model('TravelCharge', new mongoose.Schema({
  departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', unique: true },
  charges: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function readSeed(filename) {
  const filepath = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  SKIP: seeds/${filename} not found`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  // 1. Options — upsert by (type, value) and prune stale options
  const optionsData = readSeed('options.json');
  if (optionsData) {
    let inserted = 0, updated = 0;
    for (const { type, label, value } of optionsData) {
      const result = await Option.updateOne(
        { type, value },
        { $set: { type, label, value } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.modifiedCount) updated++;
    }

    // Prune stale options that are not in options.json
    const validTypes = [...new Set(optionsData.map(o => o.type))];
    const existing = await Option.find({ type: { $in: validTypes } }).lean();
    const validKeys = new Set(optionsData.map(o => `${o.type}:::${o.value}`));
    const idsToDelete = existing
      .filter(o => !validKeys.has(`${o.type}:::${o.value}`))
      .map(o => o._id);

    let deleted = 0;
    if (idsToDelete.length > 0) {
      const delResult = await Option.deleteMany({ _id: { $in: idsToDelete } });
      deleted = delResult.deletedCount;
    }

    console.log(`  Options: ${inserted} inserted, ${updated} updated, ${deleted} stale deleted`);
  }

  // 2. Regions — upsert by (name1, name2)
  const regionsData = readSeed('regions.json');
  if (regionsData) {
    let inserted = 0, updated = 0;
    for (const { name1, name2 } of regionsData) {
      const result = await Region.updateOne(
        { name1, name2 },
        { $set: { name1, name2 } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.modifiedCount) updated++;
    }
    console.log(`  Regions: ${inserted} inserted, ${updated} updated`);
  }

  // Build lookup maps: name → ObjectId (needed for charge references)
  const regions = await Region.find({}).lean();
  const name1ToId = {};
  const name2ToId = {};
  for (const r of regions) {
    name1ToId[r.name1] = r._id;
    name2ToId[r.name2] = r._id;
  }

  // 3. PostalCharges — replace by departure region
  const postalData = readSeed('postalcharges.json');
  if (postalData) {
    let inserted = 0, updated = 0;
    for (const { departure_name1, charges } of postalData) {
      const departureId = name1ToId[departure_name1];
      if (!departureId) {
        console.warn(`  PostalCharge SKIP: unknown departure region "${departure_name1}"`);
        continue;
      }
      const chargesMap = {};
      for (const [destName2, amount] of Object.entries(charges)) {
        const destId = name2ToId[destName2];
        if (destId) chargesMap[destId.toString()] = amount;
        else console.warn(`    PostalCharge: unknown destination "${destName2}" — skipped`);
      }
      const result = await PostalCharge.updateOne(
        { departure: departureId },
        { $set: { departure: departureId, charges: chargesMap } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.modifiedCount) updated++;
    }
    console.log(`  PostalCharges: ${inserted} inserted, ${updated} updated`);
  }

  // 4. TravelCharges — same pattern
  const travelData = readSeed('travelcharges.json');
  if (travelData) {
    let inserted = 0, updated = 0;
    for (const { departure_name1, charges } of travelData) {
      const departureId = name1ToId[departure_name1];
      if (!departureId) {
        console.warn(`  TravelCharge SKIP: unknown departure region "${departure_name1}"`);
        continue;
      }
      const chargesMap = {};
      for (const [destName2, amount] of Object.entries(charges)) {
        const destId = name2ToId[destName2];
        if (destId) chargesMap[destId.toString()] = amount;
        else console.warn(`    TravelCharge: unknown destination "${destName2}" — skipped`);
      }
      const result = await TravelCharge.updateOne(
        { departure: departureId },
        { $set: { departure: departureId, charges: chargesMap } },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else if (result.modifiedCount) updated++;
    }
    console.log(`  TravelCharges: ${inserted} inserted, ${updated} updated`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
