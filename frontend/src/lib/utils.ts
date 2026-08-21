import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined, fmt = "MMM d, yyyy") {
    if (!date) return "—";
    return format(new Date(date), fmt);
}

export function timeAgo(date: string) {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCurrency(amount: string | number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(Number(amount));
}

export function getInitials(name?: string | null): string {
    if (!name?.trim()) return "?";       // safe fallback
    return name
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);                    // cap at 2 chars for avatar UIs
}

export function getAvatarUrl(avatar: string | null) {
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    return `${process.env.NEXT_PUBLIC_MEDIA_URL}${avatar}`;
}

export function statusColor(status: string) {
    const map: Record<string, string> = {
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        archived: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        planning: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        on_hold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        busy: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
        failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
}

export function toBody(
    data: unknown,
    fileFields: string[]
): FormData | Record<string, unknown> {
    const record = data as Record<string, unknown>;
    const hasFile = fileFields.some((f) => record[f] instanceof File);
    if (!hasFile) return record;

    const fd = new FormData();
    for (const [key, value] of Object.entries(record)) {
        if (value === undefined || value === null) continue;
        if (value instanceof File) fd.append(key, value);
        else if (Array.isArray(value)) fd.append(key, JSON.stringify(value));
        else fd.append(key, String(value));
    }
    return fd;
}