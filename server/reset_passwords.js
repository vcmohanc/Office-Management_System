import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

mongoose.connect('mongodb://localhost:27017/office_manage_system').then(async () => {
  const hash = await bcrypt.hash('password123', 10);
  await User.updateMany({}, { password: hash });
  console.log('All passwords reset to: password123');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
