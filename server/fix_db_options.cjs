const mongoose = require('mongoose');
require('dotenv').config();

const optionSchema = new mongoose.Schema({
  type: String,
  label: String,
  value: String
}, { timestamps: true });

const Option = mongoose.model('Option', optionSchema);

async function fixDB() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Delete all existing ExpenseType options
  await Option.deleteMany({ type: 'ExpenseType' });
  
  // Desired order
  const orderedExpenseTypes = [
    'Postage',
    'Transportation Expenses / Flight Fare',
    'Waiting Dormitory Fee',
    'Hospital/ Drugs Expenses',
    'Equipment/Supplies',
    'Visa application fee',
    'WIFI',
    'Hostel Fee',
    'Language Class Fee',
    'others',
    'Drugs'
  ];

  for (const val of orderedExpenseTypes) {
    await Option.create({
      type: 'ExpenseType',
      label: val,
      value: val
    });
  }

  console.log('Fixed and reordered expense types in DB!');
  process.exit(0);
}

fixDB().catch(console.error);
