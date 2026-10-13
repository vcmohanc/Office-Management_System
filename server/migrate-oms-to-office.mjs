/**
 * Migration: copy all collections from "oms" → "office_manage_system"
 *
 * - Safe to run multiple times (upserts by _id, never overwrites existing docs)
 * - Does NOT drop the "oms" database — you can verify and drop it manually
 *
 * Run: node server/migrate-oms-to-office.mjs
 */
import { MongoClient } from 'mongodb';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let MONGO_URI;
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: path.join(__dirname, '.env') });
  MONGO_URI = process.env.MONGO_URI;
} catch {}

if (!MONGO_URI) {
  MONGO_URI = 'mongodb://localhost:27017';
}

// Strip the database name from the URI so we can pick our own
const baseURI = MONGO_URI.replace(/\/[^/?]+(\?|$)/, '/$1').replace(/\/$/, '');
// Fallback: if URI has no db segment, use as-is
const connectionURI = baseURI || MONGO_URI;

const SOURCE_DB = 'oms';
const TARGET_DB = 'office_manage_system';

console.log(`\nConnecting to MongoDB...`);
console.log(`  Source : ${SOURCE_DB}`);
console.log(`  Target : ${TARGET_DB}\n`);

const client = new MongoClient(connectionURI.includes('://') ? connectionURI : `mongodb://${connectionURI}`);

try {
  await client.connect();

  const sourceDb = client.db(SOURCE_DB);
  const targetDb = client.db(TARGET_DB);

  const collections = await sourceDb.listCollections().toArray();

  if (collections.length === 0) {
    console.log(`No collections found in "${SOURCE_DB}". Nothing to migrate.`);
    process.exit(0);
  }

  console.log(`Found ${collections.length} collection(s) in "${SOURCE_DB}":\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const sourceColl = sourceDb.collection(colName);
    const targetColl = targetDb.collection(colName);

    const docs = await sourceColl.find({}).toArray();
    if (docs.length === 0) {
      console.log(`  [${colName}] — empty, skipped`);
      continue;
    }

    let migrated = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await targetColl.updateOne(
          { _id: doc._id },
          { $setOnInsert: doc },
          { upsert: true }
        );
        migrated++;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key — document already exists in target, leave it alone
          skipped++;
        } else {
          console.error(`  [${colName}] Error on doc ${doc._id}: ${err.message}`);
        }
      }
    }

    console.log(`  [${colName}] ${docs.length} docs → inserted/upserted: ${migrated}, already existed: ${skipped}`);
    totalMigrated += migrated;
    totalSkipped += skipped;
  }

  console.log(`\n✓ Migration complete.`);
  console.log(`  Total upserted : ${totalMigrated}`);
  console.log(`  Total skipped  : ${totalSkipped} (already in office_manage_system)`);
  console.log(`\nThe "oms" database was NOT dropped.`);
  console.log(`Once you have verified the data, you can drop it from MongoDB Compass:`);
  console.log(`  Right-click "oms" → Drop Database\n`);

} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.close();
}
