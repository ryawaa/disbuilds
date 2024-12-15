"use client";
import ClientHome from "@/components/ClientHome";

export default function Home() {
    return <ClientHome apiUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/latest`} />;
}

export const revalidate = 3600; // revalidate every hour
