const mongoose = require('mongoose');
require('dotenv').config();
const optionSchema = new mongoose.Schema({ type: String, label: String, value: String }, { timestamps: true });
const Option = mongoose.model('Option', optionSchema);

async function renameOptions() {
  await mongoose.connect(process.env.MONGO_URI);
  await Option.updateOne({ type: 'ExpenseType', value: 'Visa application fee' }, { $set: { label: 'Visa Application Fee', value: 'Visa Application Fee' } });
  await Option.updateOne({ type: 'ExpenseType', value: 'Language Class Fee' }, { $set: { label: 'Language Course Fee', value: 'Language Course Fee' } });
  await Option.updateOne({ type: 'ExpenseType', value: 'Hostel Fee' }, { $set: { label: 'Accommodation cost', value: 'Accommodation cost' } });
  console.log("Renamed options in DB");
  process.exit(0);
}
renameOptions().catch(console.error);
