import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

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
        // The source media URLs are UUID-versioned. Keep optimized variants at
        // Cloudflare's edge for a day while Next.js still controls invalidation.
        minimumCacheTTL: 86_400,
        dangerouslyAllowSVG: false,
        dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    },
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
});
