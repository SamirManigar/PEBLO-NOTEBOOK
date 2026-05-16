import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: ['192.168.1.45', 'localhost'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.45:3000', 'localhost:3000'],
    },
  },
  // For development access on the network
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
