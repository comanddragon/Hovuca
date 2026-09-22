// src/services/donors.service.ts

import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";
import type {
    DonorOrganization,
    DonorOrganizationDetail,
    DonorContact,
    Grant,
    GrantDetail,
    DonorEngagement,
    DonorSummary,
    DonorOrganizationFilters,
    GrantFilters,
    DonorEngagementFilters,
} from "@/types";

// ─── Query key factory (mirrors eventKeys / galleryKeys pattern) ───────────────

export const donorKeys = {
    all: ["donors"] as const,

    organizations: {
        all:      ()         => [...donorKeys.all, "organizations"] as const,
        lists:    ()         => [...donorKeys.organizations.all(), "list"] as const,
        list:     (f: DonorOrganizationFilters) =>
            [...donorKeys.organizations.lists(), f] as const,
        byOrganization: (orgIdOrSlug: string, f?: DonorOrganizationFilters) =>
            [...donorKeys.organizations.all(), "organization", orgIdOrSlug, f] as const,
        detail:   (id: string) => [...donorKeys.organizations.all(), "detail", id] as const,
    },

    contacts: {
        all:      ()            => [...donorKeys.all, "contacts"] as const,
        byOrg:    (orgId: string) => [...donorKeys.contacts.all(), orgId] as const,
        detail:   (id: string)  => [...donorKeys.contacts.all(), "detail", id] as const,
    },

    grants: {
        all:      ()         => [...donorKeys.all, "grants"] as const,
        lists:    ()         => [...donorKeys.grants.all(), "list"] as const,
        list:     (f: GrantFilters) => [...donorKeys.grants.lists(), f] as const,
        detail:   (id: string) => [...donorKeys.grants.all(), "detail", id] as const,
        byOrg:    (orgId: string) => [...donorKeys.grants.all(), "org", orgId] as const,
    },

    engagements: {
        all:      ()         => [...donorKeys.all, "engagements"] as const,
        lists:    ()         => [...donorKeys.engagements.all(), "list"] as const,
        list:     (f: DonorEngagementFilters) =>
            [...donorKeys.engagements.lists(), f] as const,
    },

    summary:      ()         => [...donorKeys.all, "summary"] as const,
} as const;

// ─── DonorOrganization service ────────────────────────────────────────────────

export const donorOrganizationService = {
    list: async (
        filters: DonorOrganizationFilters = {}
    ): Promise<PaginatedResponse<DonorOrganization>> => {
        const { data } = await api.get("/donors/organizations/", { params: filters });
        return data;
    },

    get: async (id: string): Promise<DonorOrganizationDetail> => {
        const { data } = await api.get(`/donors/organizations/${id}/`);
        return data;
    },

    /** Fetch all grants for a specific donor org (paginated) */
    getGrants: async (
        id: string,
        params?: Pick<GrantFilters, "page" | "page_size">
    ): Promise<PaginatedResponse<Grant>> => {
        const { data } = await api.get(`/donors/organizations/${id}/grants/`, { params });
        return data;
    },

    /** Fetch all engagement logs for a specific donor org */
    getEngagements: async (
        id: string,
        params?: Pick<DonorEngagementFilters, "page" | "page_size">
    ): Promise<PaginatedResponse<DonorEngagement>> => {
        const { data } = await api.get(`/donors/organizations/${id}/engagements/`, { params });
        return data;
    },

    /** Fetch all contacts for a specific donor org */
    getContacts: async (id: string): Promise<DonorContact[]> => {
        const { data } = await api.get(`/donors/organizations/${id}/contacts/`);
        return data;
    },

    /** Force-recalculate totals + tier (admin action) */
    recalculate: async (id: string): Promise<{ detail: string }> => {
        const { data } = await api.post(`/donors/organizations/${id}/recalculate/`);
        return data;
    },
};

// ─── Grant service ────────────────────────────────────────────────────────────

export const grantService = {
    list: async (filters: GrantFilters = {}): Promise<PaginatedResponse<Grant>> => {
        const { data } = await api.get("/donors/grants/", { params: filters });
        return data;
    },

    get: async (id: string): Promise<GrantDetail> => {
        const { data } = await api.get(`/donors/grants/${id}/`);
        return data;
    },

    complete: async (id: string): Promise<GrantDetail> => {
        const { data } = await api.post(`/donors/grants/${id}/complete/`);
        return data;
    },

    submitReport: async (id: string): Promise<{ detail: string; report_submitted_at: string }> => {
        const { data } = await api.post(`/donors/grants/${id}/submit-report/`);
        return data;
    },
};

// ─── DonorEngagement service ──────────────────────────────────────────────────

export const donorEngagementService = {
    list: async (
        filters: DonorEngagementFilters = {}
    ): Promise<PaginatedResponse<DonorEngagement>> => {
        const { data } = await api.get("/donors/engagements/", { params: filters });
        return data;
    },
};

// ─── Summary service ──────────────────────────────────────────────────────────

export const donorSummaryService = {
    get: async (): Promise<DonorSummary> => {
        const { data } = await api.get("/donors/summary/");
        return data;
    },
};