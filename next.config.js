/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }
  },
  eslint: {
    // Safety net: don't fail production builds on lint. Keep local linting with `npm run lint`.
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
