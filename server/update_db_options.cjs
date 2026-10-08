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
  
  // Update Hospital Fee -> Hospital/ Drugs Expenses
  await Option.updateMany(
    { type: 'ExpenseType', value: 'Hospital Fee' },
    { $set: { label: 'Hospital/ Drugs Expenses', value: 'Hospital/ Drugs Expenses' } }
  );

  // Add Hostel Fee and Language Class if not exists
  const existing = await Option.findOne({ type: 'ExpenseType', value: 'Hostel Fee and Language Class' });
  if (!existing) {
    await Option.create({
      type: 'ExpenseType',
      label: 'Hostel Fee and Language Class',
      value: 'Hostel Fee and Language Class'
    });
  }

  console.log('Database updated successfully!');
  process.exit(0);
}

updateDB().catch(console.error);
