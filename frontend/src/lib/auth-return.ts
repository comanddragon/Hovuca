export function getSafeReturnPath(value: string | null, fallback = "/dashboard") {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
    if (/^\/(login|register)(?:[/?#]|$)/.test(value)) return fallback;
    return value;
}

export function getBrowserReturnPath(fallback = "/dashboard") {
    if (typeof window === "undefined") return fallback;
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested) return getSafeReturnPath(requested, fallback);

    if (document.referrer) {
        try {
            const previous = new URL(document.referrer);
            if (previous.origin === window.location.origin) {
                return getSafeReturnPath(
                    `${previous.pathname}${previous.search}${previous.hash}`,
                    fallback,
                );
            }
        } catch {
            // Ignore malformed or non-browser referrers and use the fallback.
        }
    }

    return fallback;
}

export function authPath(path: "/login" | "/register", returnPath: string) {
    return `${path}?next=${encodeURIComponent(returnPath)}`;
}
