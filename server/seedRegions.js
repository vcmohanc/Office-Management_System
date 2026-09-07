import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Region from './models/Region.js';
import PostalCharge from './models/PostalCharge.js';
import TravelCharge from './models/TravelCharge.js';

dotenv.config();

const REGIONS = [
  'Hokkaido',
  'Northern Tohoku',
  'Southern Tohoku',
  'Kanto',
  'Shinetsu',
  'Hokuriku',
  'Chubu',
  'Kansai',
  'Chugoku',
  'Shikoku',
  'Kyushu',
  'Okinawa'
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/office_manage_system');
    console.log('Connected to MongoDB');

    // 1. Seed Regions
    console.log('Seeding Regions...');
    const regionIds = {};
    for (const name of REGIONS) {
      let region = await Region.findOne({ name1: name });
      if (!region) {
        region = await Region.create({ name1: name, name2: name });
      }
      regionIds[name] = region._id;
    }
    console.log('Regions seeded.');

    // 2. Clear old charges to migrate properly
    console.log('Clearing old charges...');
    await PostalCharge.deleteMany({});
    await TravelCharge.deleteMany({});

    // 3. Re-seed default charges
    console.log('Seeding default charges...');
    const getInitialCharges = () => {
      const matrix = {};
      REGIONS.forEach(departure => {
        matrix[departure] = {};
        REGIONS.forEach(destination => {
          let val = '4,530';
          if (departure === destination) {
            val = 'なし';
          } else if (
            (departure === 'Okinawa' && destination !== 'Okinawa') || 
            (destination === 'Okinawa' && departure !== 'Okinawa')
          ) {
            val = '9,130';
          }
          matrix[departure][destination] = val;
        });
      });
      return matrix;
    };

    const initialData = getInitialCharges();

    // Map the string keys to ObjectId keys for charges Map
    for (const departureName of REGIONS) {
      const chargesMap = new Map();
      
      for (const destName of REGIONS) {
        // use ObjectId as key in the Map
        chargesMap.set(regionIds[destName].toString(), initialData[departureName][destName]);
      }

      await PostalCharge.create({
        departure: regionIds[departureName],
        charges: chargesMap
      });

      await TravelCharge.create({
        departure: regionIds[departureName],
        charges: chargesMap
      });
    }

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
