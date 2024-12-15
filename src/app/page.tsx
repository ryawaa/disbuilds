import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWindows,
    faApple,
    faLinux,
} from "@fortawesome/free-brands-svg-icons";

const platforms = [
    { name: "Windows", icon: faWindows, key: "windows" },
    { name: "macOS", icon: faApple, key: "mac" },
    { name: "Linux", icon: faLinux, key: "linux" },
];

// This function should be replaced with actual OS detection logic
const getDetectedOS = () => "macOS";

async function getLatestVersions() {
    const res = await fetch('http://localhost:3000/api/latest', { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
}

export default async function Home() {
    const detectedOS = getDetectedOS();
    const latestVersions = await getLatestVersions();

    return (
        <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-black">
            <div className="flex-grow flex items-center">
                <main className="w-full max-w-3xl">
                    <h1 className="text-2xl font-light mb-2 text-center text-gray-300">
                        disbuilds
                    </h1>
                    <h3 className="text-sm font-light mb-16 text-center text-gray-300">
                        The Discord Build Archive
                    </h3>
                    <h3 className="text-sm font-light mb-4 text-center text-gray-300">
                        Select your platform
                    </h3>
                    <div className="flex justify-center space-x-12">
                        {platforms.map((platform) => (
                            <Link
                                key={platform.name}
                                href={`/builds?platform=${platform.name.toLowerCase()}`}
                                className="no-underline group"
                            >
                                <div className="flex flex-col items-center cursor-pointer transition-all duration-300">
                                    <div
                                        className={`flex flex-col w-32 h-40 items-center justify-center
                                      ${
                                          platform.name.toLowerCase() ===
                                          detectedOS.toLowerCase()
                                              ? "bg-gray-800 bg-opacity-50 rounded-2xl border-white border-opacity-60 border"
                                              : ""
                                      }`}
                                    >
                                        <FontAwesomeIcon
                                            icon={platform.icon}
                                            className="platform-icon opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{
                                                fontSize: "5rem",
                                                width: "5rem",
                                                height: "5rem",
                                            }}
                                        />
                                        <span className="text-sm font-light mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                            {platform.name}
                                        </span>
                                        <span className="text-xs font-light mb-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                            {latestVersions[platform.key]?.version || 'Loading...'}
                                        </span>
                                    </div>
                                    {detectedOS.toLowerCase() ===
                                        platform.name.toLowerCase() && (
                                        <span className="text-sm bg-white text-black px-4 rounded-3xl py-0.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                            Continue
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
            <footer className="w-full max-w-3xl text-center text-gray-500 text-sm">
                <div className="mb-2">
                    <Link href="https://nekocord.dev" className="hover:text-white">
                        download nekocord
                    </Link>{" "}
                    ·{" "}
                    <Link href="https://discord.com" className="hover:text-white">
                        download discord
                    </Link>{" "}
                    ·{" "}
                    <Link href="https://cute.fm" className="hover:text-white">
                        back to cute.fm
                    </Link>
                </div>
                <div>
                    maintained by <Link href="https://cute.fm/" className="hover:text-white">ryana</Link> ·{" "}
                    <Link href="https://github.com/ryawaa/disbuilds" className="hover:text-white">
                        source code
                    </Link>
                </div>
            </footer>
        </div>
    );
}
