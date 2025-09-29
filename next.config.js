/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Allow embedding Power BI
          { key: "X-Frame-Options", value: "ALLOW-FROM https://app.powerbi.com" },
          // CSP (relaxed to allow Power BI frames & scripts)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.powerbi.com;",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data: https://*.powerbi.com https://*.microsoft.com;",
              "frame-src https://app.powerbi.com https://*.powerbigov.us;",
              "connect-src 'self' https://app.powerbi.com https://wabi-*.analysis.windows.net;",
            ].join(" ")
          }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
