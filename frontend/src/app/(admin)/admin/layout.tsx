"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen flex-col bg-muted/20">
                <Navbar />
                <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6">
                    <AdminSidebar />
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </AdminGuard>
    );
}