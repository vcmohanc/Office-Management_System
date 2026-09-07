import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Region from './models/Region.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');

    // Use raw mongodb collection to bypass Mongoose schema restrictions
    // in case the schema doesn't have 'name' anymore.
    const collection = mongoose.connection.collection('regions');
    
    // Drop the old unique index on 'name' if it exists, otherwise it will complain about duplicate nulls
    try {
      await collection.dropIndex('name_1');
    } catch (e) {
      console.log('Index name_1 might not exist or already dropped:', e.message);
    }

    const regions = await collection.find({}).toArray();

    for (const region of regions) {
      if (region.name) {
        await collection.updateOne(
          { _id: region._id },
          { 
            $set: { name1: region.name, name2: region.name },
            $unset: { name: 1 } 
          }
        );
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();
