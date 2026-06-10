import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: __dirname,
  // Self-contained server bundle — used by the Electron desktop build and by
  // any Node host. Harmless for Vercel (it handles output mode itself).
  output: "standalone",
  async redirects() {
    return [
      { source: "/quotes", destination: "/#quotes", permanent: false },
      { source: "/market-map", destination: "/#market-map", permanent: false },
      { source: "/portfolio", destination: "/#portfolio", permanent: false },
      { source: "/trades", destination: "/#trades", permanent: false },
      { source: "/analytics", destination: "/#analytics", permanent: false },
      { source: "/journal", destination: "/#journal", permanent: false },
    ];
  },
};

export default nextConfig;
