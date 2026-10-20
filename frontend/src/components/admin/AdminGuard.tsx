"use client";

import React from "react";
import { redirect } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PageLoader } from "@/components/shared";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { adminService, adminKeys } from "@/services/admin.service";
import { AdminError } from "./AdminStates";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isHydrated } = useAuthStore();
    const pathname = usePathname();
    const params = useSearchParams();
    // Verify authorization with Django; persisted profile data is not authority.
    const access = useQuery({ queryKey: adminKeys.catalog, queryFn: adminService.catalog, enabled: isHydrated && Boolean(user), retry: false, staleTime: 0 });

    if (!isHydrated || isLoading) return <PageLoader />;
    if (!user) redirect(`/login?next=${encodeURIComponent(`${pathname}${params.size ? `?${params}` : ""}`)}`);
    if (access.isLoading) return <PageLoader />;
    if (access.isError) {
        if (isAxiosError(access.error) && access.error.response?.status === 403) redirect("/dashboard");
        return <AdminError error={access.error} retry={() => access.refetch()} />;
    }

    return <>{children}</>;
}
