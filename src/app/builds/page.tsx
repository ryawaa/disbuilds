"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import {
    faWindows,
    faApple,
    faLinux,
} from "@fortawesome/free-brands-svg-icons";
import axios from "axios";
import { ErrorBoundary } from "react-error-boundary";

const platforms = [
    { name: "Windows", key: "windows", icon: faWindows },
    { name: "macOS", key: "mac", icon: faApple },
    { name: "Linux", key: "linux", icon: faLinux },
];

interface Build {
    version: string;
    platform: string;
    installerLink: string;
    installerSize: number;
    installerEtag: string;
    mirrorLink: string;
    downloadAllModLink: string;
    customInstallLink: string;
    nekocordTimeMachineLink: string;
    modules: {
        [key: string]: {
            downloadLink: string;
            downloadSize: number;
            downloadEtag: string;
        };
    };
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface LatestBuild {
    version: string;
    installerLink: string;
    installerSize: number;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function ErrorFallback({
    error,
    resetErrorBoundary,
}: {
    error: Error;
    resetErrorBoundary: () => void;
}) {
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre>{error.message}</pre>
            <button onClick={resetErrorBoundary}>Try again</button>
        </div>
    );
}

function SkeletonLoader() {
    return (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-600 rounded w-1/4"></div>
                </div>
            </div>
        </div>
    );
}

function BuildsPageContent() {
    const searchParams = useSearchParams();
    const [selectedPlatform, setSelectedPlatform] = useState(
        searchParams.get("platform") || "windows"
    );
    const [expandedBuild, setExpandedBuild] = useState<string | null>(null);
    const [builds, setBuilds] = useState<Build[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [latestBuild, setLatestBuild] = useState<LatestBuild | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const platform = searchParams.get("platform");
        if (platform && platform !== selectedPlatform) {
            setSelectedPlatform(platform);
            setBuilds([]);
            setIsLoading(true);
        }
    }, [searchParams, selectedPlatform]);

    const fetchLatestBuild = async () => {
        try {
            const response = await axios.get("/api/latest");
            setLatestBuild(response.data[selectedPlatform]);
        } catch (error) {
            console.error("Failed to fetch latest build:", error);
        }
    };

    const fetchBuilds = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await axios.get("/api/builds", {
                params: {
                    platform: selectedPlatform,
                    page,
                    limit: 20,
                },
            });
            if (page === 1) {
                setBuilds(response.data.builds);
            } else {
                setBuilds((prevBuilds) => [
                    ...prevBuilds,
                    ...response.data.builds,
                ]);
            }
            setPagination(response.data.pagination);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch builds:", error);
            setError("Failed to fetch builds. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestBuild();
        fetchBuilds();
    }, [selectedPlatform]);

    const toggleExpand = (version: string) => {
        setExpandedBuild(expandedBuild === version ? null : version);
    };

    const loadMore = () => {
        if (pagination && pagination.page < pagination.pages) {
            fetchBuilds(pagination.page + 1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-8 bg-black text-white">
            <main className="w-full max-w-4xl">
                <h1 className="text-2xl font-light mb-2 text-center">
                    disbuilds
                </h1>
                <h3 className="text-sm font-light mb-8 text-center text-gray-300">
                    The Discord Build Archive
                </h3>

                <div className="flex justify-center space-x-2 mb-8">
                    {platforms.map((platform) => (
                        <Link
                            key={platform.name}
                            href={`/builds?platform=${platform.key}`}
                            className={`px-4 py-2 rounded-md no-underline ${
                                selectedPlatform === platform.key
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            <FontAwesomeIcon
                                icon={platform.icon}
                                className="mr-2"
                            />
                            {platform.name}
                        </Link>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {latestBuild && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Latest Build
                        </h2>
                        <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium">
                                        Version: {latestBuild.version}
                                    </span>
                                </div>
                                {latestBuild.installerLink ? (
                                    <Link
                                        href={latestBuild.installerLink}
                                        className="bg-pink-500 hover:bg-pink-600 px-4 py-1 rounded-3xl text-sm flex items-center"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download Installer
                                        <span className="ml-1">
                                            (
                                            {formatFileSize(
                                                latestBuild.installerSize
                                            )}
                                            )
                                        </span>
                                    </Link>
                                ) : (
                                    <span className="text-gray-400">
                                        Installer not available
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <SkeletonLoader />
                ) : (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Available Builds
                        </h2>
                        <div className="space-y-4">
                            {builds.length > 0 ? (
                                builds.map((build) => (
                                    <div
                                        key={build.version}
                                        className="bg-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">
                                                    {build.version}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {build.installerLink ? (
                                                    <Link
                                                        href={
                                                            build.installerLink
                                                        }
                                                        className="bg-pink-500 hover:bg-pink-600 px-4 py-1 rounded-3xl text-sm"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Download Installer
                                                        <span className="ml-1">
                                                            (
                                                            {formatFileSize(
                                                                build.installerSize
                                                            )}
                                                            )
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Installer not available
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        toggleExpand(
                                                            build.version
                                                        )
                                                    }
                                                    className="px-2 py-1"
                                                    aria-label={
                                                        expandedBuild ===
                                                        build.version
                                                            ? "Collapse"
                                                            : "Expand"
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon={
                                                            expandedBuild ===
                                                            build.version
                                                                ? faChevronUp
                                                                : faChevronDown
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                        {expandedBuild === build.version && (
                                            <div className="mt-4 space-y-4">
                                                <div className="text-md flex flex-col gap-2">
                                                    <span className="text-sm">
                                                        Installer Etag:{" "}
                                                        {build.installerEtag
                                                            ? build.installerEtag.replace(
                                                                  /"/g,
                                                                  ""
                                                              )
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                                <div className="text-md flex flex-row gap-2">
                                                    <Link
                                                        href={
                                                            build.nekocordTimeMachineLink ||
                                                            "#"
                                                        }
                                                        className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded-3xl text-xs"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Install in Time Machine
                                                        (Nekocord)
                                                    </Link>
                                                    <Link
                                                        href={
                                                            build.downloadAllModLink ||
                                                            "#"
                                                        }
                                                        className="bg-pink-500 hover:bg-pink-600 px-2 py-1 rounded-3xl text-xs"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Download all modules
                                                        (.zip)
                                                    </Link>
                                                </div>
                                                <div className="text-md flex flex-col gap-2">
                                                    <span className="font-medium">
                                                        Modules{" "}
                                                    </span>
                                                    <hr className="border-gray-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    {Object.keys(
                                                        build.modules
                                                    ).map((key) => {
                                                        const moduleData =
                                                            build.modules[key];
                                                        return (
                                                            <div
                                                                key={key}
                                                                className="flex justify-between items-center"
                                                            >
                                                                <span className="text-sm flex items-center">
                                                                    {key}
                                                                    {moduleData?.etag && (
                                                                        <span className="ml-2 text-xs text-gray-500">
                                                                            {moduleData.etag.replace(
                                                                                /"/g,
                                                                                ""
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {moduleData?.downloadLink ? (
                                                                    <Link
                                                                        href={
                                                                            moduleData.downloadLink
                                                                        }
                                                                        className="bg-pink-500 hover:bg-pink-600 px-2 py-1 rounded-3xl text-xs"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        Download
                                                                        (
                                                                        {formatFileSize(
                                                                            moduleData.fileSize
                                                                        )}
                                                                        )
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        Not
                                                                        available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400">
                                    No builds available for this platform
                                </div>
                            )}
                        </div>
                        {pagination && pagination.page < pagination.pages && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={loadMore}
                                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="w-full max-w-4xl text-center text-gray-500 text-sm mt-8">
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

export default function BuildsPage() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<div>Loading...</div>}>
                <BuildsPageContent />
            </Suspense>
        </ErrorBoundary>
    );
}
