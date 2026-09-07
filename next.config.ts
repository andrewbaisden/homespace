import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
