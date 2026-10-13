/**
 * Emergency password reset utility — DEVELOPMENT USE ONLY.
 * Run with: node reset_passwords.js --confirm
 * Refused in production (NODE_ENV=production).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Refusing to run in production. Unset NODE_ENV or use a proper credential rotation process.');
  process.exit(1);
}

if (!process.argv.includes('--confirm')) {
  console.error('ERROR: Pass --confirm to proceed. This resets ALL user passwords.');
  console.error('Usage: node reset_passwords.js --confirm');
  process.exit(1);
}

const TARGET_PASSWORD = process.env.RESET_PASSWORD;
if (!TARGET_PASSWORD || TARGET_PASSWORD.length < 12) {
  console.error('ERROR: Set RESET_PASSWORD env var to a strong password (min 12 chars).');
  console.error('Usage: RESET_PASSWORD=<new-password> node reset_passwords.js --confirm');
  process.exit(1);
}

mongoose.connect('mongodb://localhost:27017/office_manage_system').then(async () => {
  const hash = await bcrypt.hash(TARGET_PASSWORD, 12);
  const result = await User.updateMany({}, { password: hash });
  console.log(`Reset ${result.modifiedCount} user(s). Password was set from RESET_PASSWORD env var (not logged).`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
