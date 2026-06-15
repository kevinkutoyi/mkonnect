/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Compression ──────────────────────────────────────────────────────────────
  compress:        true,
  poweredByHeader: false,   // removes X-Powered-By: Next.js

  // ── Image optimisation ───────────────────────────────────────────────────────
  images: {
    formats:         ["image/avif", "image/webp"],   // 50-80% smaller than JPEG/PNG
    deviceSizes:     [640, 750, 828, 1080, 1200, 1920],
    imageSizes:      [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,              // 30-day CDN cache
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // ── HTTP headers ──────────────────────────────────────────────────────────────
  async headers() {
    return [
      // Security headers on all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      // Immutable cache for hashed static chunks
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // 7-day cache for /public images
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      // Never cache API responses
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
