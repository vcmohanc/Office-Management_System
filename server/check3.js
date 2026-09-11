import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/office_manage_system').then(async () => {
  const db = mongoose.connection.db;
  const claims = await db.collection('claims').find({ receipts: { $exists: true, $not: {$size: 0} } }).toArray();
  console.log(JSON.stringify(claims.map(c => c.receipts), null, 2));
  process.exit(0);
});
