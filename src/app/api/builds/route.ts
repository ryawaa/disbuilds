import { NextRequest, NextResponse } from "next/server";
import { MongoClient, Document } from "mongodb";
import { LRUCache } from 'lru-cache';

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

interface ModuleInfo {
    version: string;
    module_name: string;
    downloadSize: number;
    mirrorSize: number;
    downloadEtag: string;
    mirrorEtag: string;
    downloadLink: string;
    mirrorLink: string;
}

interface Build {
    platform: string;
    version: string;
    installerLink: string;
    mirrorLink: string;
    downloadAllModLink: string;
    customInstallLink: string;
    nekocordTimeMachineLink: string;
    installerSize: number;
    mirrorSize: number;
    downloadAllModSize: number;
    customInstallSize: number;
    installerEtag: string;
    mirrorEtag: string;
    downloadAllModEtag: string;
    customInstallEtag: string;
    modules: {
        [key: string]: ModuleInfo | null;
    };
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


const cache = new LRUCache<string, { builds: Build[], totalCount: number }>({
    max: 100,
    ttl: 1000 * 60 * 5, 
});

export async function GET(request: NextRequest) {
    try {
        const client = await getMongoClient();
        const db = client.db("discord_builds");
        const versionsCollection = db.collection("versions");

        const searchParams = request.nextUrl.searchParams;
        const platform = searchParams.get("platform");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 20;
        const skip = (page - 1) * limit;

        console.log(
            `Received request - Platform: ${platform}, Page: ${page}, Limit: ${limit}, Skip: ${skip}`
        );

        
        const cacheKey = `builds_${platform}_${page}_${limit}`;
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
            console.log("Returning cached result");
            return NextResponse.json({
                builds: cachedResult.builds,
                pagination: {
                    total: cachedResult.totalCount,
                    page,
                    limit,
                    pages: Math.ceil(cachedResult.totalCount / limit),
                },
            });
        }

        const matchStage = platform ? { $match: { platform } } : { $match: {} };

        const lookupStages = MODULE_NAMES.map(moduleName => ({
            $lookup: {
                from: moduleName,
                localField: "version",
                foreignField: "version",
                as: moduleName
            }
        }));

        const pipeline = [
            matchStage,
            { $sort: { version: -1 } },
            { $skip: skip },
            { $limit: limit },
            ...lookupStages,
            {
                $project: {
                    _id: 0,
                    platform: 1,
                    version: 1,
                    installerLink: 1,
                    mirrorLink: 1,
                    downloadAllModLink: 1,
                    customInstallLink: 1,
                    nekocordTimeMachineLink: 1,
                    installerSize: 1,
                    mirrorSize: 1,
                    downloadAllModSize: 1,
                    customInstallSize: 1,
                    installerEtag: 1,
                    mirrorEtag: 1,
                    downloadAllModEtag: 1,
                    customInstallEtag: 1,
                    modules: Object.fromEntries(MODULE_NAMES.map(moduleName => [
                        moduleName,
                        { $arrayElemAt: [`$${moduleName}`, 0] }
                    ]))
                }
            }
        ];

        const [builds, totalCount] = await Promise.all([
            versionsCollection.aggregate(pipeline).toArray(),
            versionsCollection.countDocuments(matchStage.$match)
        ]);

        console.log(`Total builds found: ${totalCount}`);
        console.log(`Builds after pagination: ${builds.length}`);

        const processedBuilds: Build[] = builds.map((build: Document) => ({
            platform: build.platform,
            version: build.version,
            installerLink: build.installerLink,
            mirrorLink: build.mirrorLink,
            downloadAllModLink: build.downloadAllModLink,
            customInstallLink: build.customInstallLink,
            nekocordTimeMachineLink: build.nekocordTimeMachineLink,
            installerSize: build.installerSize,
            mirrorSize: build.mirrorSize,
            downloadAllModSize: build.downloadAllModSize,
            customInstallSize: build.customInstallSize,
            installerEtag: build.installerEtag,
            mirrorEtag: build.mirrorEtag,
            downloadAllModEtag: build.downloadAllModEtag,
            customInstallEtag: build.customInstallEtag,
            modules: Object.fromEntries(
                MODULE_NAMES.map(moduleName => [
                    moduleName,
                    build.modules[moduleName] || null
                ])
            )
        }));

        
        cache.set(cacheKey, { builds: processedBuilds, totalCount });

        return NextResponse.json({
            builds: processedBuilds,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching builds:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}


export const dynamic = 'force-dynamic';
