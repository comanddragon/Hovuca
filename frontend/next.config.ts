import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "moyrtqapgxyldxgyhvnl.supabase.co",
                port: "",
                pathname: "/storage/v1/object/public/media/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                port: "",
                pathname: "/**",
          },
        ],
        minimumCacheTTL: 60,
                dangerouslyAllowSVG: false,
    },
  reactCompiler: true,
};

export default nextConfig;