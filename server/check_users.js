import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost:27017/office_manage_system').then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({ username: String }));
  const users = await User.find({});
  console.log(users.map(u => u.username));
  process.exit(0);
});
