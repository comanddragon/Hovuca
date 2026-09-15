"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import Cookies from "js-cookie";

/**
 * Call once in a top-level Client Component to hydrate the (auth) store
 * from the server session cookie on first mount.
 */

export function useAuthBootstrap() {
    const { setUser, setLoading, isAuthenticated } = useAuthStore();

    // useAuthBootstrap.ts
    useEffect(() => {
        const token = Cookies.get("access_token");

        if (!token) {
            setLoading(false);
            return;
        }

        if (isAuthenticated) {
            setLoading(false); // ← immediately resolve, don't wait
            return;
        }

        setLoading(true);
        authService.me()
            .then((user) => setUser(user))
            .catch(() => {
                Cookies.remove("access_token", { path: "/" });
                Cookies.remove("refresh_token", { path: "/" });
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [isAuthenticated, setLoading, setUser]);

    return { isLoading: useAuthStore(s => s.isLoading) };
}
