const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/office_manage_system').then(async () => {
  const docs = await mongoose.connection.collection('settlements').find({ caseId: { $regex: 'a2ebd4', $options: 'i' } }).toArray();
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
});
