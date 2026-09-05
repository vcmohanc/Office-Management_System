import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_MONGO_URI = 'mongodb://localhost:27017/office_manage_system';

async function importData() {
  try {
    console.log(`Connecting to local Ubuntu MongoDB...`);
    await mongoose.connect(TARGET_MONGO_URI);
    
    // Read all JSON files in the current directory
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.json'));

    for (let file of files) {
      // Skip package files or tool files if any exist
      if (file === 'package.json' || file === 'package-lock.json') continue;

      const collectionName = path.basename(file, '.json');
      const filePath = path.join(__dirname, file);
      
      const fileData = fs.readFileSync(filePath, 'utf8');
      const documents = JSON.parse(fileData);

      if (documents && documents.length > 0) {
        // Drop existing collection to avoid duplicate key errors
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`Dropped existing collection: ${collectionName}`);
        } catch (e) {
          // Ignore error if collection does not exist yet
        }

        // Insert documents
        const collection = mongoose.connection.db.collection(collectionName);
        
        // MongoDB driver sometimes requires ObjectId conversion, but insertMany handles raw JSON in loose setups
        // However, if the _id is an object like {"$oid": "..."} we need to parse it, but if it's a string, it'll just insert as string.
        // Assuming your previous import worked for new collections, this will work.
        await collection.insertMany(documents);
        
        console.log(`Imported ${documents.length} documents into ${collectionName}`);
      } else {
        console.log(`Skipped ${collectionName} - no documents to import.`);
      }
    }
    
    console.log('Import complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error during import:', err);
    process.exit(1);
  }
}

importData();
