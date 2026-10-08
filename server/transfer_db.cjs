const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const sourceDbName = 'oms';
    const targetDbName = 'office_manage_system';
    
    const sourceDb = client.db(sourceDbName);
    const targetDb = client.db(targetDbName);
    
    const collections = await sourceDb.listCollections().toArray();
    
    for (let coll of collections) {
      if (coll.name.startsWith('system.')) continue;
      
      console.log(`Copying collection: ${coll.name}`);
      
      // Get all documents
      const docs = await sourceDb.collection(coll.name).find({}).toArray();
      
      if (docs.length > 0) {
        // Clear target collection first to avoid duplicates
        await targetDb.collection(coll.name).deleteMany({});
        await targetDb.collection(coll.name).insertMany(docs);
        console.log(`Inserted ${docs.length} documents into ${targetDbName}.${coll.name}`);
      } else {
        console.log(`Collection ${coll.name} is empty.`);
      }
    }
    
    console.log(`Dropping database ${sourceDbName}...`);
    await sourceDb.dropDatabase();
    console.log(`Database ${sourceDbName} dropped successfully.`);
    
  } catch (error) {
    console.error('Error during transfer:', error);
  } finally {
    await client.close();
  }
}

main();
