/**
 * ui.store.ts
 * ===========
 * Global UI state — sidebar visibility, active modal, theme.
 * No server data lives here; this is purely client/interaction state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModalId =
    | "donate"
    | "auth"
    | "confirm-delete"
    | "image-preview"
    | null;

interface UIState {
    // ── Sidebar ────────────────────────────────────────────────────────
    sidebarOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;

    // ── Modals ─────────────────────────────────────────────────────────
    activeModal: ModalId;
    modalPayload: Record<string, unknown> | null;
    openModal: (id: ModalId, payload?: Record<string, unknown>) => void;
    closeModal: () => void;

    // ── Theme ──────────────────────────────────────────────────────────
    theme: "light" | "dark" | "system";
    setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // ── Sidebar ────────────────────────────────────────────────
            sidebarOpen: true,
            openSidebar:  () => set({ sidebarOpen: true }),
            closeSidebar: () => set({ sidebarOpen: false }),
            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

            // ── Modals ─────────────────────────────────────────────────
            activeModal:  null,
            modalPayload: null,
            openModal: (id, payload = undefined) =>
                set({ activeModal: id, modalPayload: payload }),
            closeModal: () => set({ activeModal: null, modalPayload: null }),

            // ── Theme ──────────────────────────────────────────────────
            theme: "system",
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: "ui-store",
            // Only persist theme & sidebar preference — not ephemeral modal state
            partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }),
        }
    )
);
