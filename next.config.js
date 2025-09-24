/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  eslint: {
    ignoreDuringBuilds: true, // prevents lint from failing the prod build
  },
};
module.exports = nextConfig;
