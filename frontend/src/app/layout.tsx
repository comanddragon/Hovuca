import { type Metadata } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
import {NotificationProvider} from "@/components/shared/NotificationProvider";
import { Atkinson_Hyperlegible_Next } from "next/font/google";

const atkinson = Atkinson_Hyperlegible_Next({
    subsets: ["latin"],
    weight: "variable",
    variable: "--font-atkinson",
    display: "swap",
    fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
    icons: {
        // This must be root-relative: a relative URL turns into
        // `/admin/favicon.ico` on the frontend admin routes, which has no
        // metadata asset handler in the Cloudflare worker.
        icon: "/favicon.ico",
    },
    title: { default: "Hovuca", template: "%s | HOVUCA" },
    description: "Empowering communities through research, advocacy, education and community partnerships.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={atkinson.variable}>
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
