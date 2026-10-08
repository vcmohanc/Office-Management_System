const mongoose = require('mongoose');
require('dotenv').config();

const optionSchema = new mongoose.Schema({
  type: String,
  label: String,
  value: String
}, { timestamps: true });

const Option = mongoose.model('Option', optionSchema);

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const options = await Option.find({ type: 'ExpenseType' });
  console.log(options.map(o => o.value));

  process.exit(0);
}

checkDB().catch(console.error);
