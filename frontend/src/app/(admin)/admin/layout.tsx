"use client";

import React, { Suspense } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading admin workspace…</div>}><AdminGuard>
            <div className="flex min-h-screen flex-col bg-muted/20">
                <AdminHeader />
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
                    <AdminSidebar />
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </AdminGuard></Suspense>
    );
}
