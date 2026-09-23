import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from '../models/Case.js';
import { generateLedgerForCase } from '../utils/calc_settlement.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/oms';

const migrate = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const cases = await Case.find({});
    console.log(`Found ${cases.length} cases to process.`);

    let successCount = 0;
    let errorCount = 0;

    for (const caseDoc of cases) {
      try {
        await generateLedgerForCase(caseDoc);
        successCount++;
      } catch (err) {
        console.error(`Failed to process case ${caseDoc._id}:`, err);
        errorCount++;
      }
    }

    console.log('Migration completed.');
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
