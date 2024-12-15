import ClientHome from '@/components/ClientHome';
import axios from 'axios';

async function getLatestVersions() {
    try {
        const res = await axios.get('http://localhost:3000/api/latest', {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
        return res.data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw new Error('Failed to fetch data');
    }
}

export default async function Home() {
    const latestVersions = await getLatestVersions();

    return <ClientHome latestVersions={latestVersions} />;
}

export const revalidate = 3600; // revalidate every hour
