/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14 App Router caches rendered server-component pages on the
    // client (Router Cache) for the session, even when `dynamic` is set
    // to 'force-dynamic'. staleTimes={0,0} disables that cache so soft
    // navigations refetch instead of showing pre-migration data.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // Belt-and-suspenders: prevent the browser/CDN from caching school-
  // scoped pages. force-dynamic alone wasn't enough on Vercel's edge.
  async headers() {
    return [
      {
        source: '/:school((?!auth|profile|messages|api|_next).+)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/profile/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
