import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const MONGODB_URI = 'mongodb://localhost:27017/office_manage_system';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users for a fresh start (optional, but good for testing)
    await User.deleteMany({});
    console.log('Cleared existing users');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      { username: 'admin', password: hashedPassword, role: 'admin' },
      { username: 'reviewer_user', password: hashedPassword, role: 'reviewer' },
      { username: 'accounting_user', password: hashedPassword, role: 'accounting' },
      { username: 'applicant_user', password: hashedPassword, role: 'applicant' },
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully:', users.map(u => ({ username: u.username, role: u.role })));

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
