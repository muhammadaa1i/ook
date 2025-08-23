import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oyoqkiyim.duckdns.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
