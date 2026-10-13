/**
 * One-time migration: backfill tokenVersion: 0 for all user documents
 * that were created before the tokenVersion field was added to the schema.
 *
 * Run once: node server/migrate-token-version.mjs
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system';

await mongoose.connect(MONGO_URI);

const result = await mongoose.connection.collection('users').updateMany(
  { tokenVersion: { $exists: false } },
  { $set: { tokenVersion: 0 } }
);

console.log(`Migration complete. Updated ${result.modifiedCount} user(s).`);
await mongoose.disconnect();
