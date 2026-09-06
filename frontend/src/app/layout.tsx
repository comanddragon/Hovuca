import { type Metadata } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
import {NotificationProvider} from "@/components/shared/NotificationProvider";
import {DM_Sans, Manrope} from "next/font/google";

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    display: "swap",
});

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
    display: "swap",
});

export const metadata: Metadata = {
    icons: {
        icon: "./favicon.ico",
    },
    title: { default: "Hovuca", template: "%s | HOVUCA" },
    description: "Empowering communities through research, advocacy, education and community partnerships.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${dmSans.variable} ${manrope.variable}`}>
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
