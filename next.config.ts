import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  output: "standalone",
  poweredByHeader: false
};

export default nextConfig;
