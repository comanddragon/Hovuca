"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PageLoader } from "@/components/shared";

const ALLOWED_ROLES = ["admin", "staff"];

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isHydrated } = useAuthStore();

    if (!isHydrated || isLoading) return <PageLoader />;
    if (!user) redirect("/login?next=/admin");
    if (!ALLOWED_ROLES.includes(user.role)) redirect("/dashboard");

    return <>{children}</>;
}
