/**
 * seed-all.js — full database seed for fresh deployments.
 *
 * Seeds in order:
 *   1. Reference data  (Options, Regions, PostalCharges, TravelCharges)
 *   2. Business data   (employees, resignations, b2bpartners)
 *
 * Safe to re-run — all operations are upserts.
 *
 * Usage inside Docker container:
 *   docker compose exec server node scripts/seed-all.js
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

// ── Reference models ──────────────────────────────────────────────────────────

const Option = mongoose.model('Option', new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => new mongoose.Types.ObjectId() },
    type: String, label: String, value: String
  }, { timestamps: true }
));
const Region = mongoose.model('Region', new mongoose.Schema(
  { name1: String, name2: String }, { timestamps: true }
));
const PostalCharge = mongoose.model('PostalCharge', new mongoose.Schema(
  { departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', unique: true },
    charges: { type: Map, of: String } }, { timestamps: true }
));
const TravelCharge = mongoose.model('TravelCharge', new mongoose.Schema(
  { departure: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', unique: true },
    charges: { type: Map, of: mongoose.Schema.Types.Mixed } }, { timestamps: true }
));

// ── Helpers ───────────────────────────────────────────────────────────────────

function readSeed(filename) {
  const filepath = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(filepath)) { console.warn(`  SKIP: seeds/${filename} not found`); return null; }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function toObjectId(id) {
  if (!id) return new mongoose.Types.ObjectId();
  try {
    const raw = id?.$oid ?? id?.toString?.() ?? id;
    return new mongoose.Types.ObjectId(String(raw).replace(/^ObjectId\(["']?|["']?\)$/g, ''));
  } catch { return new mongoose.Types.ObjectId(); }
}

function prepareDoc(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v && typeof v === 'object' && '$oid' in v) {
      out[k] = new mongoose.Types.ObjectId(v.$oid);
    } else if (v && typeof v === 'object' && '$date' in v) {
      out[k] = new Date(v.$date);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = prepareDoc(v);
    } else if (Array.isArray(v)) {
      out[k] = v.map(item => (item && typeof item === 'object') ? prepareDoc(item) : item);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function seedCollection(colName, filename) {
  const docs = readSeed(filename);
  if (!docs || docs.length === 0) { console.log(`  ${colName}: 0 docs — skipped`); return; }

  const db = mongoose.connection.db;
  const ops = docs.map(doc => {
    const prepared = prepareDoc(doc);
    return {
      replaceOne: {
        filter: { _id: toObjectId(doc._id) },
        replacement: { ...prepared, _id: toObjectId(doc._id) },
        upsert: true,
      },
    };
  });

  const result = await db.collection(colName).bulkWrite(ops, { ordered: false });
  console.log(`  ${colName}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
}

// ── Reference seed ────────────────────────────────────────────────────────────

async function seedReference() {
  console.log('\n── Reference data ───────────────────────────────────────');

  // 1. Options
  const optionsData = readSeed('options.json');
  if (optionsData) {
    let inserted = 0, updated = 0;
    for (const { type, label, value } of optionsData) {
      const r = await Option.updateOne({ type, value }, { $set: { type, label, value } }, { upsert: true });
      if (r.upsertedCount) inserted++; else if (r.modifiedCount) updated++;
    }
    const validTypes = [...new Set(optionsData.map(o => o.type))];
    const existing = await Option.find({ type: { $in: validTypes } })
      .sort({ updatedAt: -1, createdAt: 1 })
      .lean();
    const validKeys = new Set(optionsData.map(o => `${o.type}:::${o.value}`));
    const seenKeys = new Set();
    const toDelete = [];
    for (const o of existing) {
      const key = `${o.type}:::${o.value}`;
      if (!validKeys.has(key) || seenKeys.has(key)) {
        toDelete.push(o._id);
      } else {
        seenKeys.add(key);
      }
    }
    let deleted = 0;
    if (toDelete.length > 0) { const r = await Option.collection.deleteMany({ _id: { $in: toDelete } }); deleted = r.deletedCount; }
    console.log(`  Options: ${inserted} inserted, ${updated} updated, ${deleted} stale/duplicate deleted`);
  }

  // 2. Regions
  const regionsData = readSeed('regions.json');
  if (regionsData) {
    let inserted = 0, updated = 0;
    for (const { name1, name2 } of regionsData) {
      const r = await Region.updateOne({ name1, name2 }, { $set: { name1, name2 } }, { upsert: true });
      if (r.upsertedCount) inserted++; else if (r.modifiedCount) updated++;
    }
    console.log(`  Regions: ${inserted} inserted, ${updated} updated`);
  }

  const regions = await Region.find({}).lean();
  const name1ToId = {}, name2ToId = {};
  for (const r of regions) { name1ToId[r.name1] = r._id; name2ToId[r.name2] = r._id; }

  // 3. PostalCharges
  const postalData = readSeed('postalcharges.json');
  if (postalData) {
    let inserted = 0, updated = 0;
    for (const { departure_name1, charges } of postalData) {
      const deptId = name1ToId[departure_name1];
      if (!deptId) { console.warn(`  PostalCharge SKIP: unknown departure "${departure_name1}"`); continue; }
      const chargesMap = {};
      for (const [dest, amt] of Object.entries(charges)) {
        const dId = name2ToId[dest]; if (dId) chargesMap[dId.toString()] = amt;
      }
      const r = await PostalCharge.updateOne({ departure: deptId }, { $set: { departure: deptId, charges: chargesMap } }, { upsert: true });
      if (r.upsertedCount) inserted++; else if (r.modifiedCount) updated++;
    }
    console.log(`  PostalCharges: ${inserted} inserted, ${updated} updated`);
  }

  // 4. TravelCharges
  const travelData = readSeed('travelcharges.json');
  if (travelData) {
    let inserted = 0, updated = 0;
    for (const { departure_name1, charges } of travelData) {
      const deptId = name1ToId[departure_name1];
      if (!deptId) { console.warn(`  TravelCharge SKIP: unknown departure "${departure_name1}"`); continue; }
      const chargesMap = {};
      for (const [dest, amt] of Object.entries(charges)) {
        const dId = name2ToId[dest]; if (dId) chargesMap[dId.toString()] = amt;
      }
      const r = await TravelCharge.updateOne({ departure: deptId }, { $set: { departure: deptId, charges: chargesMap } }, { upsert: true });
      if (r.upsertedCount) inserted++; else if (r.modifiedCount) updated++;
    }
    console.log(`  TravelCharges: ${inserted} inserted, ${updated} updated`);
  }
}

// ── Business data seed ────────────────────────────────────────────────────────

async function seedBusinessData() {
  console.log('\n── Business data ────────────────────────────────────────');
  await seedCollection('employees',   'employees.json');
  await seedCollection('resignations','resignations.json');
  await seedCollection('b2bpartners', 'b2bpartners.json');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(MONGO_URI, { dbName: 'office_manage_system' });
  console.log('Connected to MongoDB (office_manage_system)');

  await seedReference();
  await seedBusinessData();

  console.log('\nAll seeds complete.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
