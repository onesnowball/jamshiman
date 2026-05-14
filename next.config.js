/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14 App Router caches rendered server-component pages on the
    // client (Router Cache) for the session, even when `dynamic` is set
    // to 'force-dynamic'. Symptom: new DB rows invisible on soft
    // navigations until the user hits Cmd+R. Disable both stale windows
    // so every navigation refetches.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
}
module.exports = nextConfig
