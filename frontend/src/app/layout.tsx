import { type Metadata } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
import {NotificationProvider} from "@/components/shared/NotificationProvider";
import {Poppins, Fraunces} from 'next/font/google'

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-poppins",
    display: "swap",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    style: ["normal", "italic"],
    variable: "--font-fraunces",
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
        <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={poppins.variable}>
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