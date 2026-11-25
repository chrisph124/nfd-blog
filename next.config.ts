import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['dd-trace'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a2.storyblok.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
