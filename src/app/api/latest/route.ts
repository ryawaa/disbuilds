import axios from 'axios';
import { NextResponse } from 'next/server';

interface DiscordVersions {
  windows: {
    version: string;
    downloadLink: string;
  };
  mac: {
    version: string;
    downloadLink: string;
  };
  linux: {
    version: string;
    downloadLink: string;
  };
}

const DISCORD_BASE_URLS = {
  windows: 'https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64',
  mac: 'https://discord.com/api/download?platform=osx',
  linux: 'https://discord.com/api/download?platform=linux&format=deb',
};

function extractVersion(url: string): string {
  const parts = url.split('/');
  const versionPattern = /^\d+\.\d+\.\d+$/;

  for (const part of parts) {
    if (versionPattern.test(part)) {
      return part;
    }
  }

  const filenamePattern = /(\d+\.\d+\.\d+)/;
  const filenameMatch = parts[parts.length - 1].match(filenamePattern);
  return filenameMatch ? filenameMatch[1] : 'Unknown Version';
}

async function getLatestDiscordVersion(platform: string, url: string): Promise<{ version: string; downloadLink: string }> {
  try {
    const response = await axios.head(url, {
      validateStatus: (status) => status >= 200 && status < 400,
      maxRedirects: 3, 
      timeout: 5000, 
    });

    const finalUrl = response.request.res.responseUrl || url;
    const version = extractVersion(finalUrl);

    return { version, downloadLink: finalUrl };
  } catch (error) {
    console.error(`Error fetching Discord version for ${platform}:`, error);
    return { version: 'Error fetching version', downloadLink: url };
  }
}

async function getLatestDiscordVersions(): Promise<DiscordVersions> {
  const [windows, mac, linux] = await Promise.all([
    getLatestDiscordVersion('Windows', DISCORD_BASE_URLS.windows),
    getLatestDiscordVersion('macOS', DISCORD_BASE_URLS.mac),
    getLatestDiscordVersion('Linux', DISCORD_BASE_URLS.linux),
  ]);

  return { windows, mac, linux };
}

export async function GET() {
  try {
    const latestVersions = await getLatestDiscordVersions();
    return NextResponse.json(latestVersions);
  } catch (error) {
    console.error('Error while fetching Discord versions:', error);
    return NextResponse.json({ error: 'Failed to fetch Discord versions' }, { status: 500 });
  }
}
