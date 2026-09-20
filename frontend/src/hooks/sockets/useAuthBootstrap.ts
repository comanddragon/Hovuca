"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

/**
 * Call once in a top-level Client Component to hydrate the (auth) store
 * from the server session cookie on first mount.
 */

export function useAuthBootstrap() {
    const { setUser, setLoading } = useAuthStore();

    // useAuthBootstrap.ts
    useEffect(() => {
        setLoading(true);
        authService.me()
            .then((user) => setUser(user))
            .catch(() => {
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [setLoading, setUser]);

    return { isLoading: useAuthStore(s => s.isLoading) };
}
