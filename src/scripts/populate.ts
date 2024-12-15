import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface DiscordVersions {
  windows: string;
  mac: string;
  linux: string;
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

async function getLatestDiscordVersion(platform: string, url: string): Promise<string> {
  console.log(`Fetching latest Discord version for ${platform}...`);

  try {
    const response = await axios.head(url, {
      validateStatus: (status) => status >= 200 && status < 400,
      maxRedirects: 3, 
      timeout: 5000, 
    });

    const finalUrl = response.request.res.responseUrl || url;
    console.log(`[${platform}] Final URL: ${finalUrl}`);

    const version = extractVersion(finalUrl);
    console.log(`[${platform}] Extracted version: ${version}`);

    return version;
  } catch (error) {
    console.error(`Error fetching Discord version for ${platform}:`, error || error);
    return 'Error fetching version';
  }
}

async function getLatestDiscordVersions(): Promise<DiscordVersions> {
  console.log('Fetching latest Discord versions for all platforms...');

  const [windowsVersion, macVersion, linuxVersion] = await Promise.all([
    getLatestDiscordVersion('Windows', DISCORD_BASE_URLS.windows),
    getLatestDiscordVersion('macOS', DISCORD_BASE_URLS.mac),
    getLatestDiscordVersion('Linux', DISCORD_BASE_URLS.linux),
  ]);

  const versions: DiscordVersions = {
    windows: windowsVersion,
    mac: macVersion,
    linux: linuxVersion,
  };

  console.log('All versions fetched:', versions);
  return versions;
}

async function logLatestVersions() {
  console.log('Starting version fetching process...');
  try {
    const latestVersions = await getLatestDiscordVersions();
    console.log('Latest Discord versions:');
    console.log(JSON.stringify(latestVersions, null, 2));
  } catch (error) {
    console.error('Error while fetching Discord versions:', error || error);
  } finally {
    console.log('Finished fetching Discord versions.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  logLatestVersions().catch((error) => {
    console.error('Unhandled error in main script:', error.message || error);
  });
}
