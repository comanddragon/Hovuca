import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,        // ← increase from 10 to 30 min
            refetchOnWindowFocus: false,
            refetchOnMount: true,           // ← add this: refetch if data is stale on mount
            retry: (failureCount, error: unknown) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status === 401 || status === 403 || status === 404) return false;
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});
