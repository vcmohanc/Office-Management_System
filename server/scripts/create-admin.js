/**
 * One-time script to create the initial admin user.
 * Run from inside the server container:
 *   docker exec <container-name> node /app/scripts/create-admin.js <username> <password>
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const [,, username, password] = process.argv;

if (!username || !password) {
  console.error('Usage: node /app/scripts/create-admin.js <username> <password>');
  process.exit(1);
}

if (username.length < 3) {
  console.error('Username must be at least 3 characters');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system';

await mongoose.connect(MONGO_URI, { dbName: 'office_manage_system' });

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'employee' },
  tokenVersion: { type: Number, default: 0 },
  assignedPartners: [String],
  assignedBranches: [String],
}, { timestamps: true }));

const existing = await User.findOne({ username });
if (existing) {
  console.log(`User "${username}" already exists (role: ${existing.role}). No changes made.`);
  await mongoose.disconnect();
  process.exit(0);
}

const hashed = await bcrypt.hash(password, 10);
await User.create({ username, password: hashed, role: 'admin' });

console.log(`Admin user "${username}" created successfully.`);
await mongoose.disconnect();
