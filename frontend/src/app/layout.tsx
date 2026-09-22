import { type Metadata, type Viewport } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/components/shared/NotificationProvider";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { SITE_CONFIG, SITE_URL, getOrganizationSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const atkinson = Atkinson_Hyperlegible_Next({
    subsets: ["latin"],
    weight: "variable",
    variable: "--font-atkinson",
    display: "swap",
    fallback: ["Arial", "sans-serif"],
});

export const viewport: Viewport = {
    themeColor: "#1e3a2f",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_CONFIG.name} | ${SITE_CONFIG.legalName}`,
        template: `%s | ${SITE_CONFIG.name}`,
    },
    description: SITE_CONFIG.description,
    keywords: SITE_CONFIG.keywords,
    authors: [{ name: SITE_CONFIG.name, url: SITE_URL }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.legalName,
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    alternates: {
        canonical: "/",
    },
    icons: {
        icon: "/favicon.ico",
        apple: "/Hovuca.png",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: SITE_URL,
        siteName: SITE_CONFIG.name,
        title: `${SITE_CONFIG.name} | ${SITE_CONFIG.legalName}`,
        description: SITE_CONFIG.description,
        images: [
            {
                url: `${SITE_URL}/Hovuca.png`,
                width: 1200,
                height: 630,
                alt: `${SITE_CONFIG.name} - Hope for the Vulnerable and Children in Action`,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${SITE_CONFIG.name} | ${SITE_CONFIG.legalName}`,
        description: SITE_CONFIG.description,
        images: [`${SITE_URL}/Hovuca.png`],
        creator: "@hovuca",
        site: "@hovuca",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const orgSchema = getOrganizationSchema();

    return (
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={atkinson.variable}>
        <head>
            <JsonLd data={orgSchema} />
        </head>
        <body>
        <Providers>
            <NotificationProvider />
            {children}
            <Toaster position="top-right" richColors closeButton />
        </Providers>
        </body>
        </html>
    );
}

