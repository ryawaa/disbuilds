import axios from "axios";
import * as dotenv from "dotenv";
import { Db, MongoClient } from "mongodb";

dotenv.config();

interface DiscordVersions {
    windows: string;
    mac: string[];
    linux: string[];
}

const DISCORD_BASE_URLS = {
    windows:
        "https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64",
    mac: "https://stable.dl2.discordapp.net/apps/osx",
    linux: "https://stable.dl2.discordapp.net/apps/linux",
};

function extractVersion(url: string): string {
    const parts = url.split("/");
    const versionPattern = /^\d+\.\d+\.\d+$/;

    for (const part of parts) {
        if (versionPattern.test(part)) {
            return part;
        }
    }

    const filenamePattern = /(\d+\.\d+\.\d+)/;
    const filenameMatch = parts[parts.length - 1].match(filenamePattern);
    return filenameMatch ? filenameMatch[1] : "Unknown Version";
}

async function getLatestWindowsVersion(url: string): Promise<string> {
    console.log(`Fetching latest Discord version for Windows...`);

    try {
        const response = await axios.head(url, {
            validateStatus: (status) => status >= 200 && status < 400,
            maxRedirects: 3,
            timeout: 5000,
        });

        const finalUrl = response.request.res.responseUrl || url;
        console.log(`[Windows] Final URL: ${finalUrl}`);

        const version = extractVersion(finalUrl);
        console.log(`[Windows] Extracted version: ${version}`);

        return version;
    } catch (error) {
        console.error(`Error fetching Discord version for Windows:`, error);
        return "Error fetching version";
    }
}

async function checkVersions(
    baseUrl: string,
    startVersion: number,
    versionCount: number
): Promise<number[]> {
    const downloadableVersions: number[] = [];

    for (
        let version = startVersion;
        version > startVersion - versionCount;
        version--
    ) {
        const url = `${baseUrl}/0.0.${version}/modules/discord_utils-1.zip`;
        try {
            const response = await axios.head(url);
            if (response.status === 200) {
                downloadableVersions.push(version);
                console.log(`Version ${version} is downloadable.`);
            } else {
                console.log(
                    `Version ${version} is not downloadable (Status: ${response.status}).`
                );
            }
        } catch (error) {
            console.error(`Error checking version ${version}:`, error);
        }
    }

    return downloadableVersions;
}

async function getLatestDiscordVersions(): Promise<DiscordVersions> {
    console.log("Fetching latest Discord versions for all platforms...");

    const windowsVersion = await getLatestWindowsVersion(
        DISCORD_BASE_URLS.windows
    );

    const macVersions = await checkVersions(DISCORD_BASE_URLS.mac, 329, 20);
    const linuxVersions = await checkVersions(DISCORD_BASE_URLS.linux, 71, 20);

    const versions: DiscordVersions = {
        windows: windowsVersion,
        mac: macVersions.map((v) => `0.0.${v}`),
        linux: linuxVersions.map((v) => `0.0.${v}`),
    };

    console.log("All versions fetched:", versions);
    return versions;
}

async function populateDatabase(db: Db, versions: DiscordVersions) {
    const versionsCollection = db.collection("versions");

    for (const [platform, versionList] of Object.entries(versions)) {
        if (Array.isArray(versionList)) {
            for (const version of versionList) {
                await versionsCollection.updateOne(
                    { version, platform },
                    {
                        $set: {
                            version,
                            platform,
                            // TODO: add more links
                        },
                    },
                    { upsert: true }
                );
            }
        } else {
            await versionsCollection.updateOne(
                { version: versionList, platform },
                {
                    $set: {
                        version: versionList,
                        platform,
                        // TODO: add more links
                    },
                },
                { upsert: true }
            );
        }
    }

    console.log("Database populated with version information");
}

async function connectToMongoDB(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
}

async function main() {
    console.log(
        "Starting Discord version fetching and database population process..."
    );

    let client: MongoClient | null = null;
    try {
        client = await connectToMongoDB();
        const db = client.db("discord_builds");

        const latestVersions = await getLatestDiscordVersions();
        await populateDatabase(db, latestVersions);

        console.log("Latest Discord versions:");
        console.log(JSON.stringify(latestVersions, null, 2));
    } catch (error) {
        console.error(
            "Error while fetching Discord versions or populating database:",
            error
        );
    } finally {
        if (client) {
            await client.close();
        }
        console.log(
            "Finished fetching Discord versions and populating database."
        );
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error(
            "Unhandled error in main script:",
            error.message || error
        );
    });
}
