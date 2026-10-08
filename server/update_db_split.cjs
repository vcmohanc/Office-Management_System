const mongoose = require('mongoose');
require('dotenv').config();

const optionSchema = new mongoose.Schema({
  type: String,
  label: String,
  value: String
}, { timestamps: true });

const Option = mongoose.model('Option', optionSchema);

async function updateDB() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Update "Hostel Fee and Language Class" to "Hostel Fee"
  await Option.updateMany(
    { type: 'ExpenseType', value: 'Hostel Fee and Language Class' },
    { $set: { label: 'Hostel Fee', value: 'Hostel Fee' } }
  );

  // Add "Language Class Fee" if it doesn't exist
  const existing = await Option.findOne({ type: 'ExpenseType', value: 'Language Class Fee' });
  if (!existing) {
    await Option.create({
      type: 'ExpenseType',
      label: 'Language Class Fee',
      value: 'Language Class Fee'
    });
  }

  console.log('Database updated successfully for split!');
  process.exit(0);
}

updateDB().catch(console.error);
