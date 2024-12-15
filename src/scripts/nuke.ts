import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

async function nukeCollections() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error(
            "MONGODB_URI is not defined in the environment variables."
        );
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const adminDb = client.db().admin();
        const dbInfo = await adminDb.listDatabases();
        console.log(
            "Available databases:",
            dbInfo.databases.map((db) => db.name).join(", ")
        );

        const db = client.db("discord_builds");
        console.log("Current database:", db.databaseName);

        if (db.databaseName !== "discord_builds") {
            throw new Error(
                "Connected to the wrong database. Please check your MONGODB_URI."
            );
        }

        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collection(s) to drop.`);
        console.log(
            "Collections:",
            collections.map((col) => col.name).join(", ")
        );

        if (collections.length === 0) {
            console.log("No collections to drop. Database might be empty.");
        } else {
            for (const collection of collections) {
                try {
                    await db.collection(collection.name).drop();
                    console.log(`Dropped collection: ${collection.name}`);
                } catch (dropError) {
                    console.error(
                        `Error dropping collection ${collection.name}:`,
                        dropError
                    );
                }
            }
        }

        console.log("All collections have been processed.");
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await client.close();
        console.log("Disconnected from MongoDB");
    }
}

nukeCollections().catch(console.error);
