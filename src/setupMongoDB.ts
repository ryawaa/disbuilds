import { MongoClient, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

const client = new MongoClient(uri);

interface Version {
  version: string;
  downloadAllLink: string;
  downloadAllSize: string;
  openInNekocordLink: string;
  discordInstallLink: string;
}

interface Module {
  version: string;
  size: string;
  directLink: string;
  mirrorLink: string;
}

const moduleNames = [
  'discord_desktop_core',
  'discord_erlpack',
  'discord_spellcheck',
  'discord_utils',
  'discord_voice',
  'discord_zstd',
  'discord_krisp',
  'discord_game_utils',
  'discord_cloudsync',
  'discord_rpc',
  'discord_dispatch',
  'discord_modules'
];

export async function setupMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db: Db = client.db('discord_builds');

    const versionsCollection: Collection<Version> = db.collection('versions');
    await createCollectionIfNotExists(db, 'versions');
    await versionsCollection.createIndex({ version: 1 }, { unique: true });

    for (const moduleName of moduleNames) {
      await createCollectionIfNotExists(db, moduleName);
      const moduleCollection: Collection<Module> = db.collection(moduleName);
      await moduleCollection.createIndex({ version: 1 }, { unique: true });
    }

    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  } finally {
    await client.close();
  }
}

async function createCollectionIfNotExists(db: Db, collectionName: string) {
  const collections = await db.listCollections().toArray();
  if (!collections.some((col) => col.name === collectionName)) {
    await db.createCollection(collectionName);
    console.log(`Created collection: ${collectionName}`);
  } else {
    console.log(`Collection already exists: ${collectionName}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupMongoDB().catch(console.error);
}
