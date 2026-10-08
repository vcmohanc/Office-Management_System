const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  
  const docs = [
    { type: 'ExpenseType', label: 'Hostel Fee', value: 'Hostel Fee', createdAt: new Date(), updatedAt: new Date(), __v: 0 },
    { type: 'ExpenseType', label: 'Drugs', value: 'Drugs', createdAt: new Date(), updatedAt: new Date(), __v: 0 }
  ];
  
  for (const doc of docs) {
    const exists = await db.collection('options').findOne({ type: 'ExpenseType', value: doc.value });
    if (!exists) {
      await db.collection('options').insertOne(doc);
      console.log('Inserted', doc.value);
    } else {
      console.log(doc.value, 'already exists');
    }
  }
  
  mongoose.disconnect();
});
