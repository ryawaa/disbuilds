import ClientHome from "@/components/ClientHome";
import axios from "axios";

async function getLatestVersions() {
    try {
        const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/latest`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    Expires: "0",
                },
            }
        );
        return res.data;
    } catch (error) {
        console.error("Failed to fetch data:", error);
        if (axios.isAxiosError(error)) {
            if (error.code === "ECONNREFUSED") {
                throw new Error(
                    "Failed to connect to the server. Please ensure the server is running."
                );
            }
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while fetching data");
    }
}

export default async function Home() {
    try {
        const latestVersions = await getLatestVersions();
        return <ClientHome latestVersions={latestVersions} />;
    } catch (error: unknown) {
        console.error("Error in Home component:", error);
        return (
            <div>
                Error:{" "}
                {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"}
            </div>
        );
    }
}

export const revalidate = 3600; // revalidate every hour
