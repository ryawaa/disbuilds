import axios from "axios";
import { NextResponse } from "next/server";

interface DiscordVersion {
    version: string;
    installerLink: string;
    installerSize: number;
    installerEtag: string;
    mirrorLink: string;
    downloadAllModLink: string;
    customInstallLink: string;
    nekocordTimeMachineLink: string;
}

interface DiscordVersions {
    windows: DiscordVersion;
    mac: DiscordVersion;
    linux: DiscordVersion;
}

const DISCORD_BASE_URLS = {
    windows:
        "https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64",
    mac: "https://discord.com/api/download?platform=osx",
    linux: "https://discord.com/api/download?platform=linux&format=deb",
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

async function getLatestDiscordVersion(
    platform: string,
    url: string
): Promise<DiscordVersion> {
    try {
        const response = await axios.head(url, {
            validateStatus: (status) => status >= 200 && status < 400,
            maxRedirects: 3,
            timeout: 5000,
        });

        const finalUrl = response.request.res.responseUrl || url;
        const version = extractVersion(finalUrl);
        const installerSize = parseInt(
            response.headers["content-length"] || "0",
            10
        );
        const installerEtag = response.headers["etag"] || "";

        return {
            version,
            installerLink: finalUrl,
            installerSize,
            installerEtag,
            mirrorLink: "", // Placeholder, to be implemented
            downloadAllModLink: "", // Placeholder, to be implemented
            customInstallLink: "", // Placeholder, to be implemented
            nekocordTimeMachineLink: "", // Placeholder, to be implemented
        };
    } catch (error) {
        console.error(`Error fetching Discord version for ${platform}:`, error);
        return {
            version: "Error fetching version",
            installerLink: url,
            installerSize: 0,
            installerEtag: "",
            mirrorLink: "",
            downloadAllModLink: "",
            customInstallLink: "",
            nekocordTimeMachineLink: "",
        };
    }
}

async function getLatestDiscordVersions(): Promise<DiscordVersions> {
    const [windows, mac, linux] = await Promise.all([
        getLatestDiscordVersion("Windows", DISCORD_BASE_URLS.windows),
        getLatestDiscordVersion("macOS", DISCORD_BASE_URLS.mac),
        getLatestDiscordVersion("Linux", DISCORD_BASE_URLS.linux),
    ]);

    return { windows, mac, linux };
}

export async function GET() {
    try {
        const latestVersions = await getLatestDiscordVersions();
        return NextResponse.json(latestVersions, {
            headers: {
                "Cache-Control":
                    "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("Error while fetching Discord versions:", error);
        return NextResponse.json(
            { error: "Failed to fetch Discord versions" },
            { status: 500 }
        );
    }
}

export const revalidate = 3600;
