import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Case from './models/Case.js';
import Claim from './models/Claim.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oms';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Migrate Cases
    const cases = await Case.find({ statusMessage: { $ne: '' } });
    let caseCount = 0;
    for (const c of cases) {
      if (!c.messages || c.messages.length === 0) {
        let parsed = [];
        try {
          parsed = JSON.parse(c.statusMessage);
          if (!Array.isArray(parsed)) throw new Error();
        } catch {
          parsed = [{ text: c.statusMessage, date: c.updatedAt || new Date(), author: 'Account Department' }];
        }
        
        c.messages = parsed.map(p => ({
          text: p.text,
          date: p.date || new Date(),
          author: p.author || 'Account Department',
          readBySupport: true // default historical ones to true so they don't pop up
        }));
        await c.save();
        caseCount++;
      }
    }
    console.log(`Migrated ${caseCount} cases.`);

    // Migrate Claims
    const claims = await Claim.find({ statusMessage: { $ne: '' } });
    let claimCount = 0;
    for (const c of claims) {
      if (!c.messages || c.messages.length === 0) {
        let parsed = [];
        try {
          parsed = JSON.parse(c.statusMessage);
          if (!Array.isArray(parsed)) throw new Error();
        } catch {
          parsed = [{ text: c.statusMessage, date: c.updatedAt || new Date(), author: 'Account Department' }];
        }
        
        c.messages = parsed.map(p => ({
          text: p.text,
          date: p.date || new Date(),
          author: p.author || 'Account Department',
          readBySupport: true
        }));
        await c.save();
        claimCount++;
      }
    }
    console.log(`Migrated ${claimCount} claims.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
    console.log('Done.');
  }
}

migrate();
