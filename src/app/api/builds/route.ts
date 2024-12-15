import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
}

let client: MongoClient | null = null;

async function getMongoClient() {
    if (!client) {
        client = new MongoClient(uri as string);
        await client.connect();
        console.log("Connected to MongoDB");
    }
    return client;
}

const MODULE_NAMES = [
    "discord_desktop_core",
    "discord_erlpack",
    "discord_spellcheck",
    "discord_utils",
    "discord_voice",
    "discord_zstd",
    "discord_krisp",
    "discord_game_utils",
    "discord_cloudsync",
    "discord_rpc",
    "discord_dispatch",
    "discord_modules",
];

interface ModuleInfo {
    downloadLink: string;
    fileSize: number;
    etag: string;
}

interface Build {
    _id: ObjectId;
    version: string;
    platform: string;
    installerLink: string | null;
    installerSize: number | null;
    installerEtag: string | null;
    mirrorLink: string | null;
    downloadAllModLink: string | null;
    customInstallLink: string | null;
    nekocordTimeMachineLink: string | null;
    modules: { [key: string]: ModuleInfo };
}

export async function GET(request: NextRequest) {
    try {
        const client = await getMongoClient();
        const db = client.db("discord_builds");
        const versionsCollection = db.collection<Build>("versions");

        const searchParams = request.nextUrl.searchParams;
        const platform = searchParams.get("platform");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 3;

        console.log(
            `Received request - Platform: ${platform}, Page: ${page}, Limit: ${limit}`
        );

        const query = platform ? { platform } : {};
        console.log("Query:", JSON.stringify(query));

        const builds = await versionsCollection
            .find(query)
            .sort({ version: -1 })
            .toArray();

        console.log(`Total builds found: ${builds.length}`);

        const paginatedBuilds = builds.slice((page - 1) * limit, page * limit);

        console.log(`Builds after pagination: ${paginatedBuilds.length}`);

        const total = builds.length;

        const buildsWithModules = await Promise.all(
            paginatedBuilds.map(async (build: Build) => {
                const modules: { [key: string]: ModuleInfo } = {};
                for (const moduleName of MODULE_NAMES) {
                    const moduleCollection = db.collection(moduleName);
                    const moduleDoc = await moduleCollection.findOne({
                        version: build.version,
                    });
                    if (moduleDoc) {
                        modules[moduleName] = {
                            downloadLink: moduleDoc.downloadLink,
                            fileSize: moduleDoc.downloadSize,
                            etag: moduleDoc.downloadEtag,
                        };
                    }
                }
                return { ...build, modules };
            })
        );

        console.log("First few builds:", buildsWithModules.slice(0, 3));

        return NextResponse.json({
            builds: buildsWithModules.map((build: Build) => ({
                version: build.version,
                platform: build.platform,
                installerLink: build.installerLink || null,
                installerSize: build.installerSize || null,
                installerEtag: build.installerEtag || null,
                mirrorLink: build.mirrorLink || null,
                downloadAllModLink: build.downloadAllModLink || null,
                customInstallLink: build.customInstallLink || null,
                nekocordTimeMachineLink: build.nekocordTimeMachineLink || null,
                modules: build.modules,
            })),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching builds:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        if (client) {
            await client.close();
            client = null;
            console.log("Disconnected from MongoDB");
        }
    }
}
