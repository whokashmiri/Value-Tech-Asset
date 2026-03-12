
import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const isDevelopment = process.env.NODE_ENV === 'development';
const forcePWAInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === 'true';

const withPWA = withPWAInit({
  dest: 'public',
  disable: isDevelopment && !forcePWAInDev, // Allow overriding via NEXT_PUBLIC_ENABLE_PWA_IN_DEV
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allows any path from this hostname
      },
    ],
  },
  experimental: {
    // IMPORTANT: If you experience issues with Hot Module Replacement (HMR)
    // or Fast Refresh not working, ensure the URLs below match the
    // exact URL you are using to access your development environment.
    // These might change if your Firebase Studio or Cloud Workstation URL changes.
    allowedDevOrigins: [
      'https://value-tech-asset.vercel.app',
      'https://6000-firebase-studio-1748928733161.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
      'https://9000-firebase-studio-1748928733161.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
      'https://9002-firebase-studio-1748928733161.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
      'https://*.cloudworkstations.dev',
      'http://localhost:3000',
      'http://localhost:9002',
      'pncxkhkn-3000.uks1.devtunnels.ms',
    ],
  },
};


export default withPWA(nextConfig);
