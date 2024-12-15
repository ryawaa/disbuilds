"use client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWindows,
    faApple,
    faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { useEffect, useState } from "react";
import axios from "axios";

const platforms = [
    { name: "Windows", icon: faWindows, key: "windows" },
    { name: "macOS", icon: faApple, key: "mac" },
    { name: "Linux", icon: faLinux, key: "linux" },
];

function getDetectedOS() {
    if (typeof window !== "undefined") {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.indexOf("win") > -1) return "Windows";
        if (userAgent.indexOf("mac") > -1) return "macOS";
        if (userAgent.indexOf("linux") > -1) return "Linux";
    }
    return "Unknown";
}

interface VersionInfo {
    version: string;
    installerLink: string;
    installerSize: number;
    installerEtag: string;
    mirrorLink: string;
    downloadAllModLink: string;
    customInstallLink: string;
    nekocordTimeMachineLink: string;
}

interface LatestVersions {
    windows: VersionInfo;
    macOS: VersionInfo;
    linux: VersionInfo;
}

function PlatformSelector({
    latestVersions,
    detectedOS,
}: {
    latestVersions: LatestVersions | null;
    detectedOS: string;
}) {
    return (
        <div className="flex justify-center space-x-12">
            {platforms.map((platform) => (
                <Link
                    key={platform.name}
                    href={`/builds?platform=${platform.key}`}
                    className="no-underline group"
                >
                    <div className="flex flex-col items-center cursor-pointer transition-all duration-300">
                        <div
                            className={`flex flex-col w-32 h-40 items-center justify-center
                              ${
                                  platform.name === detectedOS
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
                                {latestVersions?.[platform.key as keyof LatestVersions]?.version || "Loading..."}
                            </span>
                        </div>
                        {detectedOS === platform.name && (
                            <span className="text-sm bg-white text-black px-4 rounded-3xl py-0.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                Continue
                            </span>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default function ClientHome({
    apiUrl,
}: {
    apiUrl: string;
}) {
    const [detectedOS, setDetectedOS] = useState("Unknown");
    const [latestVersions, setLatestVersions] = useState<LatestVersions | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setDetectedOS(getDetectedOS());
    }, []);

    useEffect(() => {
        const fetchLatestVersions = async () => {
            try {
                const res = await axios.get(apiUrl, {
                    headers: {
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                });
                setLatestVersions(res.data);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                if (axios.isAxiosError(error)) {
                    if (error.code === "ECONNREFUSED") {
                        setError("Failed to connect to the server. Please ensure the server is running.");
                    } else {
                        setError(`Failed to fetch data: ${error.message}`);
                    }
                } else {
                    setError("An unexpected error occurred while fetching data");
                }
            }
        };

        fetchLatestVersions();
    }, [apiUrl]);

    if (error) {
        return <div>Error: {error}</div>;
    }

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
                        {detectedOS !== "Unknown"
                            ? `We've autodetected your platform as ${detectedOS}`
                            : "Select your platform"}
                    </h3>
                    <PlatformSelector
                        latestVersions={latestVersions}
                        detectedOS={detectedOS}
                    />
                </main>
            </div>
            <footer className="w-full max-w-3xl text-center text-gray-500 text-sm">
                <div className="mb-2">
                    <Link
                        href="https://nekocord.dev"
                        className="hover:text-white"
                    >
                        download nekocord
                    </Link>{" "}
                    ·{" "}
                    <Link
                        href="https://discord.com"
                        className="hover:text-white"
                    >
                        download discord
                    </Link>{" "}
                    ·{" "}
                    <Link href="https://cute.fm" className="hover:text-white">
                        back to cute.fm
                    </Link>
                </div>
                <div>
                    maintained by{" "}
                    <Link href="https://cute.fm/" className="hover:text-white">
                        ryana
                    </Link>{" "}
                    ·{" "}
                    <Link
                        href="https://github.com/ryawaa/disbuilds"
                        className="hover:text-white"
                    >
                        source code
                    </Link>
                </div>
            </footer>
        </div>
    );
}
