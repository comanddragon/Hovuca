"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useAuthStore } from "@/store/auth.store";
import { PageLoader } from "@/components/shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuthStore();

    if (isLoading) return <PageLoader />;
    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Navbar />
            <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
                <DashboardSidebar />
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}