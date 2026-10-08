const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const options = await db.collection('options').find({}).toArray();
  console.log(JSON.stringify(options, null, 2));
  mongoose.disconnect();
});
