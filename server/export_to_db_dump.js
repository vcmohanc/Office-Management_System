import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabaseToDump() {
  try {
    await mongoose.connect('mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    const dumpDir = path.join(__dirname, 'db_dump');

    if (!fs.existsSync(dumpDir)){
        fs.mkdirSync(dumpDir);
    }

    for (let collection of collections) {
      const collectionName = collection.collectionName;
      const data = await collection.find({}).toArray();
      
      const exportPath = path.join(dumpDir, `${collectionName}.json`);
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
      
      console.log(`Exported ${data.length} documents from ${collectionName} to db_dump/${collectionName}.json`);
    }

    console.log(`\nSuccess! All collections exported to ${dumpDir}`);
  } catch (error) {
    console.error('Error exporting database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

exportDatabaseToDump();
