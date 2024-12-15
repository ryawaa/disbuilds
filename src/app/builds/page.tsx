"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { faWindows, faApple, faLinux } from "@fortawesome/free-brands-svg-icons";

const platforms = [
    { name: "Windows", icon: faWindows },
    { name: "macOS", icon: faApple },
    { name: "Linux", icon: faLinux },
];

const modules = [
    { name: "discord_desktop_core-1.zip", size: "2.3 MB" },
    { name: "discord_erlpack-1.zip", size: "1.1 MB" },
    { name: "discord_spellcheck-1.zip", size: "0.8 MB" },
    { name: "discord_utils-1.zip", size: "1.5 MB" },
    { name: "discord_voice-1.zip", size: "3.2 MB" },
    { name: "discord_zstd-1.zip", size: "0.6 MB" },
    { name: "discord_krisp-1.zip", size: "4.7 MB" },
    { name: "discord_game_utils-1.zip", size: "1.9 MB" },
    { name: "discord_cloudsync-1.zip", size: "0.4 MB" },
    { name: "discord_rpc-1.zip", size: "0.3 MB" },
    { name: "discord_dispatch-1.zip", size: "1.2 MB" },
    { name: "discord_modules-1.zip", size: "0.5 MB" }
];

interface Build {
    version: string;
    date: string;
    size: string;
    md5: string;
}

export default function BuildsPage() {
    const searchParams = useSearchParams();
    const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get('platform') || 'windows');
    const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

    useEffect(() => {
        const platform = searchParams.get('platform');
        if (platform) {
            setSelectedPlatform(platform);
        }
    }, [searchParams]);

    const builds: Build[] = [];

    const toggleExpand = (version: string) => {
        setExpandedBuild(expandedBuild === version ? null : version);
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-black text-white">
            <main className="w-full max-w-4xl">
                <h1 className="text-2xl font-light mb-2 text-center">disbuilds</h1>
                <h3 className="text-sm font-light mb-8 text-center text-gray-300">
                    The Discord Build Archive
                </h3>

                <div className="flex justify-center space-x-2 mb-8">
                    {platforms.map((platform) => (
                        <Link
                            key={platform.name}
                            href={`/builds?platform=${platform.name.toLowerCase()}`}
                            className={`px-4 py-2 rounded-md no-underline ${
                                selectedPlatform.toLowerCase() === platform.name.toLowerCase()
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <FontAwesomeIcon icon={platform.icon} className="mr-2" />
                            {platform.name}
                        </Link>
                    ))}
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Available Builds</h2>
                    <div className="space-y-4">
                        {builds.length > 0 ? (
                            builds.map((build) => (
                                <div key={build.version} className="bg-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{build.version}</span>
                                            <span className="text-sm text-gray-400 ml-4">{build.date}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-3xl text-sm" aria-label="Download all">
                                                Download All (0.0 MB)
                                            </button>
                                            <button className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-3xl text-sm" aria-label="Mirror">
                                                Mirror
                                            </button>
                                            <button 
                                                onClick={() => toggleExpand(build.version)}
                                                className="px-2 py-1"
                                                aria-label={expandedBuild === build.version ? "Collapse" : "Expand"}
                                            >
                                                <FontAwesomeIcon icon={expandedBuild === build.version ? faChevronUp : faChevronDown} />
                                            </button>
                                        </div>
                                    </div>
                                    {expandedBuild === build.version && (
                                        <div className="mt-4 space-y-4">
                                            <div className="text-sm">
                                                <span className="font-medium">MD5:</span> {build.md5}
                                            </div>
                                            <div className="flex flex-row items-center gap-2">
                                                <Link href="#" className="text-pink-400 hover:text-pink-300 text-sm">
                                                    Open in Time Machine (nekocord)
                                                </Link>
                                                <Link href="#" className="text-pink-400 hover:text-pink-300 text-sm">
                                                    Download Version Installer
                                                </Link>
                                            </div>
                                            <div className="text-md flex flex-col gap-2">
                                                <span className="font-medium">Modules </span>
                                                <hr className="border-gray-500"/>
                                            </div>
                                            <div className="space-y-2">
                                                {modules.map((module) => (
                                                    <div key={module.name} className="flex justify-between items-center">
                                                        <span className="text-sm">{module.name} ({module.size})</span>
                                                        <div className="space-x-2">
                                                            <button className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-3xl text-xs" aria-label={`Download ${module.name}`}>
                                                                Download
                                                            </button>
                                                            <button className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-3xl text-xs" aria-label={`Mirror ${module.name}`}>
                                                                Mirror
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400">
                                nop
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="w-full max-w-4xl text-center text-gray-500 text-sm mt-8">
                <div>
                    maintained by <Link href="https://cute.fm/" className="hover:text-white">
                        ryana
                    </Link> ·{" "}
                    <Link href="https://github.com/ryawaa/disbuilds" className="hover:text-white">
                        source code
                    </Link>
                </div>
            </footer>
        </div>
    );
}
