/** @type {import('next').NextConfig} */
//next.config.js
const { URL } = require('url');
const path = require('path');

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let apiHost = '';
let apiProtocol = 'https';
let apiPort = '';

try {
  if (apiUrl) {
    const parsedUrl = new URL(apiUrl);
    apiHost = parsedUrl.hostname;
    apiProtocol = parsedUrl.protocol.replace(':', '');
    apiPort = parsedUrl.port || '';
  }
} catch (e) {
  console.warn('⚠️ Invalid NEXT_PUBLIC_API_URL, skipping dynamic image domain config.');
}

const nextConfig = {
  reactStrictMode: true,

  // Set output file tracing root to silence lockfile warning
  outputFileTracingRoot: path.resolve(__dirname),

  // API rewrites to proxy requests and avoid CORS (client calls same origin)
  async rewrites() {
    const backend = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.multikonnect.com';
    const base = backend.replace(/\/$/, '');

    return {
      afterFiles: [
        { source: '/api/:path*', destination: `${base}/api/:path*` },
        { source: '/sanctum/:path*', destination: `${base}/sanctum/:path*` },
        { source: '/broadcasting/:path*', destination: `${base}/broadcasting/:path*` },
        { source: '/current-currency/:path*', destination: `${base}/current-currency/:path*` },
        { source: '/storage/:path*', destination: `${base}/storage/:path*` },
      ],
    };
  },

  // Experimental features for Next.js 16
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@heroicons/react'],
  },

  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.multikonnect.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      ...(apiHost ? [{
        protocol: apiProtocol,
        hostname: apiHost,
        port: apiPort,
        pathname: '/**',
      }] : []),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // HTTP Cache Headers - CDN Ready
  async headers() {
    // IMPORTANT:
    // In `next dev`, aggressive caching of `/_next/static/*` can cause
    // `ChunkLoadError` (stale JS chunks are cached forever and the dev server
    // keeps rebuilding). Only apply immutable caching in production.
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  // Output optimization
  // Note: swcMinify is deprecated in Next.js 13+ (enabled by default)
};

module.exports = nextConfig;
