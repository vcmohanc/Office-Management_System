import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './models/Case.js';
import Claim from './models/Claim.js';

dotenv.config();

const mapping = {
  'Transfer to the person concerned': 'direct_transfer',
  'Salary deduction': 'salary_deduction',
  'Invoice from the client company': 'client_invoice'
};

const reverseMapping = {
  'direct_transfer': 'Transfer to the person concerned',
  'salary_deduction': 'Salary deduction',
  'client_invoice': 'Invoice from the client company'
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/oms');
    console.log('Connected to MongoDB');

    const args = process.argv.slice(2);
    const isReverse = args.includes('--down');

    const mapToUse = isReverse ? reverseMapping : mapping;
    console.log(isReverse ? 'Running DOWN migration' : 'Running UP migration');

    for (const [oldValue, newValue] of Object.entries(mapToUse)) {
      // Update Cases
      const caseResult = await Case.updateMany(
        { payment_process_type: oldValue },
        { $set: { payment_process_type: newValue } }
      );
      console.log(`Cases: Mapped '${oldValue}' to '${newValue}' - Modified: ${caseResult.modifiedCount}`);

      // Update Claims
      const claimResult = await Claim.updateMany(
        { payment_process_types: oldValue },
        { $set: { payment_process_types: newValue } }
      );
      console.log(`Claims: Mapped '${oldValue}' to '${newValue}' - Modified: ${claimResult.modifiedCount}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrate();
