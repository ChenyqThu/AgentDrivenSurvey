import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['survey.chenge.ink'],
  async headers() {
    return [
      {
        // Prevent Cloudflare Tunnel from caching dev assets
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
