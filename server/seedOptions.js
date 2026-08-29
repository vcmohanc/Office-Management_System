import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Option from './models/Option.js';

dotenv.config();

const initialOptions = [
  // Locations
  { type: 'Location', label: 'Tokyo Office', value: 'Tokyo Office' },
  { type: 'Location', label: 'Osaka Office', value: 'Osaka Office' },
  { type: 'Location', label: 'Nagoya Office', value: 'Nagoya Office' },
  { type: 'Location', label: 'Fukuoka Office', value: 'Fukuoka Office' },

  // Expense Types
  { type: 'ExpenseType', label: 'Postage', value: 'Postage' },
  { type: 'ExpenseType', label: 'Transportation Expenses / Flight Fare', value: 'Transportation Expenses / Flight Fare' },
  { type: 'ExpenseType', label: 'Visa application fee', value: 'Visa application fee' },
  { type: 'ExpenseType', label: 'Waiting Dormitory Fee', value: 'Waiting Dormitory Fee' },
  { type: 'ExpenseType', label: 'Hospital Fee', value: 'Hospital Fee' },
  { type: 'ExpenseType', label: 'Equipment/Supplies', value: 'Equipment/Supplies' },
  { type: 'ExpenseType', label: 'WIFI', value: 'WIFI' },
  { type: 'ExpenseType', label: 'others', value: 'others' },

  // Advancer Categories
  { type: 'AdvancerCategory', label: 'Office', value: 'Office' },
  { type: 'AdvancerCategory', label: 'Staff', value: 'Staff' },
  { type: 'AdvancerCategory', label: 'Host Company', value: 'Host Company' },
  { type: 'AdvancerCategory', label: 'Service staff', value: 'Service staff' },
  { type: 'AdvancerCategory', label: 'VC', value: 'VC' },
  { type: 'AdvancerCategory', label: 'Dispatch destination: Farm', value: 'Dispatch destination: Farm' },
  { type: 'AdvancerCategory', label: 'Select for each project', value: 'Select for each project' },

  // Bearing Parties
  { type: 'BearingParty', label: 'Office', value: 'Office' },
  { type: 'BearingParty', label: 'Staff', value: 'Staff' },
  { type: 'BearingParty', label: 'Host Company', value: 'Host Company' },
  { type: 'BearingParty', label: 'Service staff', value: 'Service staff' },
  { type: 'BearingParty', label: 'VC', value: 'VC' },
  { type: 'BearingParty', label: 'Dispatch destination: Farm', value: 'Dispatch destination: Farm' },
  { type: 'BearingParty', label: 'Select for each project', value: 'Select for each project' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');
    
    await Option.deleteMany({});
    console.log('Cleared existing options');

    await Option.insertMany(initialOptions);
    console.log('Successfully seeded options');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding options:', err);
    process.exit(1);
  }
};

seedDB();
