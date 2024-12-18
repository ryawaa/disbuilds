import axios from "axios";
import * as dotenv from "dotenv";
import { Db, MongoClient } from "mongodb";

dotenv.config();

interface DiscordVersions {
    windows: ModuleInfo[];
    mac: ModuleInfo[];
    linux: ModuleInfo[];
}

interface ModuleInfo {
    version: string;
    downloadLink: string;
    fileSize: number;
    etag: string;
}

interface Version {
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
}

interface Module {
    version: string;
    module_name: string;
    downloadSize: number;
    mirrorSize: number;
    downloadEtag: string;
    mirrorEtag: string;
    downloadLink: string;
    mirrorLink: string;
}

const DISCORD_BASE_URLS = {
    windows: "https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64",
    mac: "https://stable.dl2.discordapp.net/apps/osx",
    linux: "https://stable.dl2.discordapp.net/apps/linux",
};

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
    if (filenameMatch) {
        return filenameMatch[1];
    }

    // Handle Windows specific URL pattern
    const windowsPattern = /\/win\/x64\/(\d+\.\d+\.\d+)\//;
    const windowsMatch = url.match(windowsPattern);
    return windowsMatch ? windowsMatch[1] : "Unknown Version";
}

async function getLatestWindowsVersion(url: string): Promise<ModuleInfo[]> {
    console.log(`Fetching latest Discord version for Windows...`);

    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
        });

        if (response.headers.location) {
            const redirectUrl = response.headers.location;
            const latestVersion = extractVersion(redirectUrl);
            console.log(`[Windows] Latest version: ${latestVersion}`);

            const versions = await checkWindowsVersions(latestVersion, 200, 329);
            return versions;
        }

        throw new Error("No redirect location found in response headers");
    } catch (error) {
        console.error(`Error fetching Discord version for Windows:`, error);
        return [];
    }
}

async function checkWindowsVersions(latestVersion: string, versionCount: number, limit: number): Promise<ModuleInfo[]> {
    const downloadableVersions: ModuleInfo[] = [];
    const [major, minor, patch] = latestVersion.split('.').map(Number);

    for (let i = 0; i < versionCount && downloadableVersions.length < limit; i++) {
        const currentPatch = patch - i;
        if (currentPatch < 0) break;

        const versionString = `${major}.${minor}.${currentPatch}`;
        const url = `https://stable.dl2.discordapp.net/distro/app/stable/win/x64/${versionString}/DiscordSetup.exe`;

        try {
            const { fileSize, etag } = await getModuleInfo(url);
            if (fileSize > 0) {
                downloadableVersions.push({
                    version: versionString,
                    downloadLink: url,
                    fileSize,
                    etag,
                });
                console.log(
                    `Installer for Windows version ${versionString} is downloadable. Size: ${fileSize} bytes, ETag: ${etag}`
                );
            }
        } catch (error) {
            console.error(
                `Error checking Windows version ${versionString}:`,
                error
            );
        }
    }

    return downloadableVersions;
}

async function getModuleInfo(
    url: string
): Promise<{ fileSize: number; etag: string }> {
    try {
        const response = await axios.head(url);
        const fileSize = parseInt(
            response.headers["content-length"] || "0",
            10
        );
        const etag = response.headers["etag"] || "";
        return { fileSize, etag };
    } catch (error) {
        console.error(`Error getting module info for ${url}:`, error);
        return { fileSize: 0, etag: "" };
    }
}

async function checkVersions(
    baseUrl: string,
    startVersion: number,
    versionCount: number,
    platform: "mac" | "linux"
): Promise<ModuleInfo[]> {
    const downloadableVersions: ModuleInfo[] = [];

    for (
        let version = startVersion;
        version > startVersion - versionCount;
        version--
    ) {
        const versionString = `0.0.${version}`;
        const moduleInfos: ModuleInfo[] = [];

        const fileName =
            platform === "mac"
                ? "Discord.dmg"
                : `discord-${versionString}.deb`;
        const url = `${baseUrl}/${versionString}/${fileName}`;

        try {
            const response = await axios.head(url);
            if (response.status === 200) {
                const { fileSize, etag } = await getModuleInfo(url);
                moduleInfos.push({
                    version: versionString,
                    downloadLink: url,
                    fileSize,
                    etag,
                });
                console.log(
                    `Installer for ${platform} version ${versionString} is downloadable. Size: ${fileSize} bytes, ETag: ${etag}`
                );
            }
        } catch (error) {
            console.error(
                `Error checking ${platform} version ${versionString}:`,
                error
            );
        }

        if (moduleInfos.length > 0) {
            downloadableVersions.push(...moduleInfos);
        } else {
            console.log(
                `No installer available for ${platform} version ${versionString}`
            );
        }
    }

    return downloadableVersions;
}

async function getLatestDiscordVersions(): Promise<DiscordVersions> {
    console.log("Fetching latest Discord versions for all platforms...");

    const [windowsVersions, macVersions, linuxVersions] = await Promise.all([
        getLatestWindowsVersion(DISCORD_BASE_URLS.windows),
        checkVersions(DISCORD_BASE_URLS.mac, 329, 330, "mac"),
        checkVersions(DISCORD_BASE_URLS.linux, 77, 78, "linux"),
    ]);

    const versions: DiscordVersions = {
        windows: windowsVersions,
        mac: macVersions,
        linux: linuxVersions,
    };

    console.log("All versions fetched:", versions);
    return versions;
}

async function populateDatabase(db: Db, versions: DiscordVersions) {
    const versionsCollection = db.collection<Version>("versions");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePromises: Promise<any>[] = [];

    for (const [platform, versionInfo] of Object.entries(versions)) {
        for (const info of versionInfo) {
            const versionDoc: Version = {
                platform,
                version: info.version,
                installerLink: info.downloadLink,
                mirrorLink: "placeholder",
                downloadAllModLink: "placeholder",
                customInstallLink: "placeholder",
                nekocordTimeMachineLink: "placeholder",
                installerSize: info.fileSize,
                mirrorSize: 0,
                downloadAllModSize: 0,
                customInstallSize: 0,
                installerEtag: info.etag,
                mirrorEtag: "",
                downloadAllModEtag: "",
                customInstallEtag: "",
            };

            updatePromises.push(
                versionsCollection.updateOne(
                    {
                        version: versionDoc.version,
                        platform: versionDoc.platform,
                    },
                    { $set: versionDoc },
                    { upsert: true }
                )
            );

            if (platform !== "windows") {
                for (const moduleName of MODULE_NAMES) {
                    const moduleCollection = db.collection<Module>(moduleName);
                    const moduleUrl = `${
                        DISCORD_BASE_URLS[
                            platform as keyof typeof DISCORD_BASE_URLS
                        ]
                    }/${info.version}/modules/${moduleName}-1.zip`;
                    updatePromises.push((async () => {
                        const { fileSize: moduleSize, etag: moduleEtag } =
                            await getModuleInfo(moduleUrl);
                        console.log(
                            `Module ${moduleName} for ${platform} version ${info.version} has size ${moduleSize} bytes and ETag ${moduleEtag}`
                        );

                        const moduleDoc: Module = {
                            version: info.version,
                            module_name: moduleName,
                            downloadSize: moduleSize,
                            mirrorSize: 0,
                            downloadEtag: moduleEtag,
                            mirrorEtag: "",
                            downloadLink: moduleUrl,
                            mirrorLink: "placeholder",
                        };

                        return moduleCollection.updateOne(
                            {
                                version: moduleDoc.version,
                                module_name: moduleDoc.module_name,
                            },
                            { $set: moduleDoc },
                            { upsert: true }
                        );
                    })());
                }
            }
        }
    }

    await Promise.all(updatePromises);
    console.log("Database populated with version information");
}

async function connectToMongoDB(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error(
            "MONGODB_URI is not defined in the environment variables"
        );
    }

    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
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
