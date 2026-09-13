import type { NextConfig } from "next";

const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
    { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
];

if (process.env.NEXT_PUBLIC_MEDIA_URL) {
    const mediaUrl = new URL(process.env.NEXT_PUBLIC_MEDIA_URL);
    remotePatterns.push({
        protocol: mediaUrl.protocol.slice(0, -1) as "http" | "https",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**`,
    });
}

const nextConfig: NextConfig = {
    images: {
        remotePatterns,
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: false,
        dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    },
  reactCompiler: true,
};

export default nextConfig;
