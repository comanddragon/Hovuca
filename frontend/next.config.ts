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
    poweredByHeader: false,
    async headers() {
        const isProduction = process.env.NODE_ENV === "production";
        const contentSecurityPolicy = [
            "default-src 'self'",
            // Next.js currently emits small inline bootstrap scripts. Restrict
            // all other script origins while retaining framework compatibility.
            isProduction
                ? "script-src 'self' 'unsafe-inline'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://images.unsplash.com https://media.hovuca.org" +
            (isProduction ? "" : " http://127.0.0.1:8000 http://localhost:8000"),
            "font-src 'self' data:",
            `connect-src 'self' https://api.hovuca.org wss://api.hovuca.org https://*.ingest.de.sentry.io${isProduction ? "" : " http://127.0.0.1:8000 http://localhost:8000 ws://127.0.0.1:8000 ws://localhost:8000" }`,
            "media-src 'self' https://media.hovuca.org" + (isProduction ? "" : " http://127.0.0.1:8000 http://localhost:8000"),
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            isProduction ? "upgrade-insecure-requests" : "",
        ].filter(Boolean).join("; ");

        return [{
            source: "/:path*",
            headers: [
                { key: "Content-Security-Policy", value: contentSecurityPolicy },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
                ...(isProduction ? [{
                    key: "Strict-Transport-Security",
                    value: "max-age=63072000; includeSubDomains; preload",
                }] : []),
            ],
        }];
    },
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

export default nextConfig;
