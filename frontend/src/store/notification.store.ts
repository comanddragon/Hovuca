/**
 * notification.store.ts
 * =====================
 * Owns the real-time notification state that comes from the WebSocket.
 *
 * Responsibilities:
 *   - Unread count (pushed by NotificationConsumer on connect & after mark-read)
 *   - In-memory feed of notifications received during the current session
 *   - Read/dismissed tracking for the bell dropdown
 *
 * TanStack Query (`useNotifications`) still owns the full paginated list
 * fetched from the REST API. This store only tracks the live, session-scoped
 * layer on top of that — so the bell badge is always instant.
 *
 * useNotificationSocket writes into this store. Components read from it.
 */

import { create } from "zustand";
import { Notification } from "@/types";

interface NotificationState {
    // ── Unread count ───────────────────────────────────────────────────
    unreadCount: number;
    incrementUnread: () => void;
    setUnreadCount: (count: number) => void;
    decrementUnread: () => void;
    clearUnread: () => void;

    // ── Live feed (session-only, not persisted) ────────────────────────
    /** Notifications received over the socket since the page was opened */
    liveFeed: Notification[];
    pushNotification: (notification: Notification) => void;
    markFeedItemRead: (id: string) => void;
    clearFeed: () => void;

    // ── Bell dropdown ──────────────────────────────────────────────────
    isOpen: boolean;
    openBell: () => void;
    closeBell: () => void;
    toggleBell: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
    // ── Unread count ───────────────────────────────────────────────────
    unreadCount: 0,

    setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),

    incrementUnread: () =>
        set((s) => ({ unreadCount: s.unreadCount + 1 })),

    decrementUnread: () =>
        set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

    clearUnread: () => set({ unreadCount: 0 }),

    // ── Live feed ──────────────────────────────────────────────────────
    liveFeed: [],

    pushNotification: (notification) =>
        set((s) => ({
            // Prepend and cap at 20 so the dropdown stays snappy
            liveFeed: [notification, ...s.liveFeed].slice(0, 20),
        })),

    markFeedItemRead: (id) =>
        set((s) => ({
            liveFeed: s.liveFeed.map((n) =>
                n.id === id ? { ...n, is_read: true } : n
            ),
        })),

    clearFeed: () => set({ liveFeed: [] }),

    // ── Bell dropdown ──────────────────────────────────────────────────
    isOpen: false,
    openBell:   () => set({ isOpen: true }),
    closeBell:  () => set({ isOpen: false }),
    toggleBell: () => set((s) => ({ isOpen: !s.isOpen })),
}));
