// src/services/events.service.ts
import api from "@/lib/api";
import type {
    PaginatedResponse,
    EventCategory,
    EventList,
    EventDetail,
    EventWrite,
    EventRegistration,
    EventRegistrationWrite,
} from "@/types";
import {toBody} from "@/lib/utils";

// ─── Query key factory ────────────────────────────────────────────────────────
export const eventKeys = {
    all: ["events"] as const,
    lists: () => [...eventKeys.all, "list"] as const,
    list: (filters: EventFilters) => [...eventKeys.lists(), filters] as const,
    featured: () => [...eventKeys.all, "featured"] as const,
    upcoming: (limit: number) => [...eventKeys.all, "upcoming", limit] as const,
    detail: (slug: string) => [...eventKeys.all, "detail", slug] as const,
    registrations: (slug: string, status?: string) =>
        [...eventKeys.all, "registrations", slug, status] as const,

    categories: {
        all: ["event-categories"] as const,
        list: (isActive?: boolean) =>
            [...eventKeys.categories.all, { isActive }] as const,
        detail: (id: number) => [...eventKeys.categories.all, id] as const,
    },
} as const;

// ─── Filter shape ─────────────────────────────────────────────────────────────
export interface EventFilters {
    category?: string;
    event_type?: string;
    status?: string;
    search?: string;
    is_featured?: boolean;
    program?: string;
    page?: number;
    page_size?: number;
}

// ─── Event Categories ─────────────────────────────────────────────────────────
export const eventCategoryService = {
    list(isActive?: boolean) {
        return api
            .get<PaginatedResponse<EventCategory>>("/events/categories/", {
                params: { is_active: isActive },
            })
            .then((r) => r.data);
    },

    get(id: number) {
        return api
            .get<EventCategory>(`/events/categories/${id}/`)
            .then((r) => r.data);
    },

    create(data: Partial<EventCategory>) {
        return api.post<EventCategory>("/events/categories/", data).then((r) => r.data);
    },

    update(id: number, data: Partial<EventCategory>) {
        return api
            .patch<EventCategory>(`/events/categories/${id}/`, data)
            .then((r) => r.data);
    },

    delete(id: number) {
        return api.delete(`/events/categories/${id}/`);
    },
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventService = {
    list(filters: EventFilters = {}) {
        return api
            .get<PaginatedResponse<EventList>>("/events/", { params: filters })
            .then((r) => r.data);
    },

    get(slug: string) {
        return api.get<EventDetail>(`/events/${slug}/`).then((r) => r.data);
    },

    featured() {
        return api.get<EventList[]>("/events/featured/").then((r) => r.data);
    },

    upcoming(limit = 6) {
        return api
            .get<EventList[]>("/events/upcoming/", { params: { limit } })
            .then((r) => r.data);
    },

    create(data: EventWrite) {
        const body = toBody(data, ["cover_image"]);
        const headers = body instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined;
        return api.post<EventDetail>("/events/", body, { headers }).then((r) => r.data);
    },

    update(slug: string, data: Partial<EventWrite>) {
        const body = toBody(data, ["cover_image"]);
        const headers = body instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined;
        return api
            .patch<EventDetail>(`/events/${slug}/`, body, { headers })
            .then((r) => r.data);
    },

    delete(slug: string) {
        return api.delete(`/events/${slug}/`);
    },

    publish(slug: string) {
        return api
            .post<{ detail: string }>(`/events/${slug}/publish/`)
            .then((r) => r.data);
    },

    cancel(slug: string) {
        return api
            .post<{ detail: string }>(`/events/${slug}/cancel/`)
            .then((r) => r.data);
    },

    register(slug: string, data: EventRegistrationWrite = {}) {
        return api
            .post<EventRegistration | { detail: string; status: string }>(
                `/events/${slug}/register/`,
                data
            )
            .then((r) => r.data);
    },

    unregister(slug: string) {
        return api
            .post<{ detail: string }>(`/events/${slug}/unregister/`)
            .then((r) => r.data);
    },

    getRegistrations(slug: string, status?: string) {
        return api
            .get<EventRegistration[]>(`/events/${slug}/registrations/`, {
                params: { status },
            })
            .then((r) => r.data);
    },
};