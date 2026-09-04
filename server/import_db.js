import mongoose from 'mongoose';
import fs from 'fs';
import User from './models/User.js';
import Employee from './models/Employee.js';
import Case from './models/Case.js';
import Claim from './models/Claim.js';
import Option from './models/Option.js';
import Settlement from './models/Settlement.js';
import B2BPartner from './models/B2BPartner.js';

const MODELS = {
  'users': User,
  'employees': Employee,
  'cases': Case,
  'claims': Claim,
  'options': Option,
  'settlements': Settlement,
  'b2bpartners': B2BPartner
};

async function importDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/office_manage_system';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    const rawData = fs.readFileSync('/app/database_export.json', 'utf-8');
    const importData = JSON.parse(rawData);

    for (const [collectionName, documents] of Object.entries(importData)) {
      if (documents.length > 0) {
        // Strip _id to let MongoDB generate new ones, OR convert string _ids to ObjectId
        const docsToInsert = documents.map(doc => {
          if (doc._id) {
            doc._id = new mongoose.Types.ObjectId(doc._id);
          }
          return doc;
        });

        if (MODELS[collectionName]) {
          const Model = MODELS[collectionName];
          await Model.deleteMany({});
          console.log(`Cleared existing collection: ${collectionName}`);
          await Model.insertMany(docsToInsert);
          console.log(`Imported ${docsToInsert.length} documents into ${collectionName} via Mongoose Model`);
        } else {
          // Native insertion for collections without models (like departments, workplaces)
          const collection = db.collection(collectionName);
          await collection.deleteMany({});
          console.log(`Cleared existing collection: ${collectionName}`);
          await collection.insertMany(docsToInsert);
          console.log(`Imported ${docsToInsert.length} documents into ${collectionName} via Native Driver`);
        }
      }
    }

    console.log('\nSuccess! Database imported successfully.');
  } catch (error) {
    console.error('Error importing database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

importDatabase();
