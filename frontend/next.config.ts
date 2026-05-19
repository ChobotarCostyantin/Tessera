import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: false,

    async redirects() {
        return [
            {
                source: '/',
                destination: '/editor',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
