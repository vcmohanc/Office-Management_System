import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/office_manage_system').then(async () => {
  const db = mongoose.connection.db;
  const cases = await db.collection('cases').find({ receipts: { $exists: true, $not: {$size: 0} } }).toArray();
  console.log(JSON.stringify(cases.map(c => c.receipts), null, 2));
  process.exit(0);
});
