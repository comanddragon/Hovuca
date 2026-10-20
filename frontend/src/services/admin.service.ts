import api from "@/lib/api";
import { isAxiosError } from "axios";

export interface AdminField {
    name: string; label: string; type: string; required: boolean; readonly: boolean;
    nullable: boolean; multiple: boolean; help: string; default: unknown;
    max_length: number | null; step: string; choices: { value: string; label: string }[];
    create_only?: boolean;
}
export interface AdminSection {
    key: string; title: string; singular: string; group: string; columns: string[];
    permissions: { create: boolean; edit: boolean; archive: boolean };
    fields?: AdminField[];
}
export interface AdminRecord {
    id: string; _label: string; _relations: Record<string, string>;
    [key: string]: unknown;
}
export interface AdminPage<T> {
    count: number; total_pages: number; next: string | null; previous: string | null; results: T[];
}
export interface AdminOverview {
    period_start: string; period_end: string; counts: Record<string, number>;
    donation_totals: { currency: string; amount: string; count: number }[];
    daily_donations: { day: string; count: number }[];
    queues: { key: string; field: string; value: string; label: string; count: number }[];
    recent_activity: { action_time: string; object_repr: string; change_message: string }[];
}
export type AdminValues = Record<string, unknown>;
export const adminKeys = {
    catalog: ["admin-workspace", "catalog"] as const,
    schema: (section: string) => ["admin-workspace", "schema", section] as const,
    records: (section: string, params?: object) => ["admin-workspace", "records", section, params] as const,
    record: (section: string, id: string) => ["admin-workspace", "record", section, id] as const,
    overview: ["admin-workspace", "overview"] as const,
};

export const adminService = {
    catalog: () => api.get<AdminSection[]>("/admin/catalog/").then(r => r.data),
    schema: (section: string) => api.get<AdminSection>(`/admin/${section}/schema/`).then(r => r.data),
    list: (section: string, params: Record<string, string | number>) => api.get<AdminPage<AdminRecord>>(`/admin/${section}/`, { params }).then(r => r.data),
    record: (section: string, id: string, archived = false) => api.get<AdminRecord>(`/admin/${section}/${id}/`, { params: archived ? { archived: "true" } : {} }).then(r => r.data),
    options: (section: string, field: string, search: string, page: number) => api.get<AdminPage<{ value: string; label: string }>>(`/admin/${section}/options/${field}/`, { params: { search, page } }).then(r => r.data),
    save: (section: string, values: AdminValues, id?: string) => {
        const hasFile = Object.values(values).some(value => value instanceof File);
        let body: AdminValues | FormData = values;
        if (hasFile) {
            body = new FormData();
            const payload: AdminValues = {};
            Object.entries(values).forEach(([name, value]) => {
                if (value instanceof File) {
                    (body as FormData).append(name, value);
                } else {
                    payload[name] = value;
                }
            });
            body.append("payload", JSON.stringify(payload));
        }
        const config = hasFile ? { headers: { "Content-Type": "multipart/form-data" } } : undefined;
        return (id ? api.patch<AdminRecord>(`/admin/${section}/${id}/`, body, config) : api.post<AdminRecord>(`/admin/${section}/`, body, config)).then(r => r.data);
    },
    archive: (section: string, id: string, restore = false) => api.post(`/admin/${section}/${id}/archive/`, { restore }),
    overview: () => api.get<AdminOverview>("/admin/overview/").then(r => r.data),
};

export function adminErrors(error: unknown): Record<string, string> {
    if (isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
        return Object.fromEntries(Object.entries(error.response.data).map(([key, value]) => [key, Array.isArray(value) ? value.join(" ") : typeof value === "object" ? JSON.stringify(value) : String(value)]));
    }
    return { detail: "The request could not be completed. Check your connection and try again." };
}

export function displayAdminValue(value: unknown, field?: AdminField): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const choice = field?.choices.find(option => String(option.value) === String(value));
    if (choice) return choice.label;
    if (field?.type === "datetime" || field?.type === "date") {
        const date = new Date(String(value));
        if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", ...(field.type === "datetime" ? { timeStyle: "short" as const } : {}) }).format(date);
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}
