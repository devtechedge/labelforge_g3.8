import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Vercel runs the serverless output; standalone is only for self-hosting.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
};

export default nextConfig;
