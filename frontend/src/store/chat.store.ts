/**
 * chat.store.ts
 * =============
 * Client state for the chat feature.
 *
 * What lives here:
 *   - Which room the user is currently in
 *   - Per-room draft message (so typing isn't lost on re-render)
 *   - Connection status per room
 *   - Whether the chat panel/drawer is open
 *
 * What does NOT live here:
 *   - Message history (owned by useChatSocket — it seeds from the server
 *     on connect and keeps it in local component state)
 *   - Typing indicators (ephemeral, owned by useChatSocket)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatState {
    // ── Active room ────────────────────────────────────────────────────
    activeRoomId: string | null;
    setActiveRoom: (roomId: string | null) => void;

    // ── Per-room draft messages ────────────────────────────────────────
    /** Map of roomId → draft string */
    drafts: Record<string, string>;
    setDraft: (roomId: string, text: string) => void;
    clearDraft: (roomId: string) => void;

    // ── Connection status ──────────────────────────────────────────────
    /** Map of roomId → connected boolean */
    connectionStatus: Record<string, boolean>;
    setConnected: (roomId: string, connected: boolean) => void;

    // ── UI ─────────────────────────────────────────────────────────────
    isPanelOpen: boolean;
    openPanel:  () => void;
    closePanel: () => void;
    togglePanel: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            // ── Active room ────────────────────────────────────────────
            activeRoomId: null,
            setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

            // ── Drafts ─────────────────────────────────────────────────
            drafts: {},
            setDraft: (roomId, text) =>
                set((s) => ({ drafts: { ...s.drafts, [roomId]: text } })),
            clearDraft: (roomId) =>
                set((s) => {
                    const rest = { ...s.drafts };
                    delete rest[roomId];
                    return { drafts: rest };
                }),

            // ── Connection status ──────────────────────────────────────
            connectionStatus: {},
            setConnected: (roomId, connected) =>
                set((s) => ({
                    connectionStatus: { ...s.connectionStatus, [roomId]: connected },
                })),

            // ── UI ─────────────────────────────────────────────────────
            isPanelOpen: false,
            openPanel:   () => set({ isPanelOpen: true }),
            closePanel:  () => set({ isPanelOpen: false }),
            togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
        }),
        {
            name: "chat-store",
            // Only persist drafts — connection status and panel state reset on reload
            partialize: (s) => ({ drafts: s.drafts }),
        }
    )
);
