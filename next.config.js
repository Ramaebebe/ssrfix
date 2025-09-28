/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  // Safety-net so lint doesn't block CI while you're fixing rules.
  eslint: { ignoreDuringBuilds: true }
};

module.exports = nextConfig;
