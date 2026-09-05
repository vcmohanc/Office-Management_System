import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace this with your production MongoDB connection string, or set the TARGET_MONGO_URI environment variable
const TARGET_MONGO_URI = process.env.TARGET_MONGO_URI || 'mongodb://localhost:27017/office_manage_system_prod';

async function importData() {
  if (!TARGET_MONGO_URI) {
    console.error('Error: TARGET_MONGO_URI is not defined.');
    process.exit(1);
  }

  try {
    console.log(`Connecting to Target Database...`);
    await mongoose.connect(TARGET_MONGO_URI);
    console.log('Connected to Target MongoDB');
    
    const exportFile = path.join(__dirname, 'database_export.json');
    if (!fs.existsSync(exportFile)){
        console.error('Export file not found: ' + exportFile);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    const collections = Object.keys(data);

    for (let collectionName of collections) {
      const documents = data[collectionName];
      if (documents && documents.length > 0) {
        // Drop existing collection to avoid duplicates (optional, comment out if you want to merge)
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`Dropped existing collection: ${collectionName}`);
        } catch (e) {
          // Ignore error if collection does not exist
        }

        // Insert documents
        const collection = mongoose.connection.db.collection(collectionName);
        await collection.insertMany(documents);
        console.log(`Imported ${documents.length} documents into ${collectionName}`);
      } else {
         console.log(`Skipped ${collectionName} - no documents to import.`);
      }
    }
    
    console.log('Import complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during import:', err);
    process.exit(1);
  }
}
importData();
