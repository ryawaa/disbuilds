"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const platforms = ["Linux", "macOS", "Windows"];

interface Build {
    version: string;
    installerLink: string;
    installerSize: number;
    installerEtag: string;
    mirrorLink: string;
    downloadAllModLink: string;
    customInstallLink: string;
    nekocordTimeMachineLink: string;
}

interface BuildsResponse {
    builds: Build[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function BuildList() {
    const [activeTab, setActiveTab] = useState("Windows");
    const [builds, setBuilds] = useState<Build[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBuilds = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get<BuildsResponse>(`/api/builds?platform=${activeTab.toLowerCase()}`);
                setBuilds(response.data.builds);
            } catch (error) {
                console.error("Error fetching builds:", error);
                setError("Failed to fetch builds. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchBuilds();
    }, [activeTab]);

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="flex border-b">
                {platforms.map((platform) => (
                    <button
                        key={platform}
                        className={`flex-1 py-2 px-4 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                            activeTab === platform ? "bg-gray-100" : ""
                        }`}
                        onClick={() => setActiveTab(platform)}
                    >
                        {platform}
                    </button>
                ))}
            </div>
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">
                    {activeTab} Builds
                </h2>
                {loading ? (
                    <p>Loading builds...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <div className="space-y-4">
                        {builds.map((build) => (
                            <div key={build.version} className="flex flex-col border-b pb-2">
                                <span className="font-medium mb-2">
                                    Version: {build.version}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {build.installerLink && (
                                        <a
                                            href={build.installerLink}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download Installer
                                            <span className="ml-2">
                                                ({formatFileSize(build.installerSize)})
                                            </span>
                                        </a>
                                    )}
                                    {build.mirrorLink && (
                                        <a
                                            href={build.mirrorLink}
                                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Mirror Link
                                        </a>
                                    )}
                                    {build.downloadAllModLink && (
                                        <a
                                            href={build.downloadAllModLink}
                                            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download All Mods
                                        </a>
                                    )}
                                    {build.customInstallLink && (
                                        <a
                                            href={build.customInstallLink}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Custom Install
                                        </a>
                                    )}
                                    {build.nekocordTimeMachineLink && (
                                        <a
                                            href={build.nekocordTimeMachineLink}
                                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded inline-flex items-center text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Nekocord Time Machine
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
