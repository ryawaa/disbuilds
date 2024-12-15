import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function nukeCollections() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }

    console.log('All collections have been nuked.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

nukeCollections().catch(console.error);
