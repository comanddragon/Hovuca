// src/store/event.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EventDetail, EventRegistration } from "@/types";
import type { EventFilters } from "@/services/events.service";

// ─── State ────────────────────────────────────────────────────────────────────
interface EventState {
  filters: EventFilters;
  selectedEvent: EventDetail | null;

  // Registration modal flow
  registrationSlug: string | null;
  registrationStatus: "idle" | "loading" | "success" | "waitlisted" | "error";
  registrationError: string | null;

  // Admin registrations panel
  registrations: EventRegistration[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
interface EventActions {
  setFilters: (patch: Partial<EventFilters>) => void;
  resetFilters: () => void;

  selectEvent: (event: EventDetail | null) => void;

  openRegistration: (slug: string) => void;
  setRegistrationStatus: (
    status: EventState["registrationStatus"],
    error?: string | null
  ) => void;
  closeRegistration: () => void;

  setRegistrations: (regs: EventRegistration[]) => void;
}

const DEFAULT_FILTERS: EventFilters = { page: 1, page_size: 12 };

export const useEventStore = create<EventState & EventActions>()(
  devtools(
    (set) => ({
      // State
      filters: DEFAULT_FILTERS,
      selectedEvent: null,
      registrationSlug: null,
      registrationStatus: "idle",
      registrationError: null,
      registrations: [],

      // Actions
      setFilters: (patch) =>
        set(
          (s) => ({ filters: { ...s.filters, ...patch, page: 1 } }),
          false,
          "event/setFilters"
        ),

      resetFilters: () =>
        set({ filters: DEFAULT_FILTERS }, false, "event/resetFilters"),

      selectEvent: (event) =>
        set({ selectedEvent: event }, false, "event/selectEvent"),

      openRegistration: (slug) =>
        set(
          { registrationSlug: slug, registrationStatus: "idle", registrationError: null },
          false,
          "event/openRegistration"
        ),

      setRegistrationStatus: (status, error = null) =>
        set(
          { registrationStatus: status, registrationError: error },
          false,
          "event/setRegistrationStatus"
        ),

      closeRegistration: () =>
        set(
          { registrationSlug: null, registrationStatus: "idle", registrationError: null },
          false,
          "event/closeRegistration"
        ),

      setRegistrations: (regs) =>
        set({ registrations: regs }, false, "event/setRegistrations"),
    }),
    { name: "EventStore" }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectEventFilters = (s: EventState) => s.filters;
export const selectSelectedEvent = (s: EventState) => s.selectedEvent;
export const selectRegistration = (s: EventState) => ({
  slug: s.registrationSlug,
  status: s.registrationStatus,
  error: s.registrationError,
});
