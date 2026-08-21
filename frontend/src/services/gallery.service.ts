// src/services/gallery.service.ts
import api from "@/lib/api";
import type {
    PaginatedResponse,
    GalleryAlbumList,
    GalleryAlbumDetail,
    GalleryAlbumWrite,
    GalleryImage,
    GalleryImageWrite,
} from "@/types";
import {toBody} from "@/lib/utils";

// ─── Query key factory ────────────────────────────────────────────────────────
export const galleryKeys = {
    all: ["gallery"] as const,

    albums: {
        all: () => ["gallery", "albums"] as const,
        lists: () => ["gallery", "albums", "list"] as const,
        list: (filters: AlbumFilters) =>
            ["gallery", "albums", "list", filters] as const,
        featured: () => ["gallery", "albums", "featured"] as const,
        detail: (slug: string) => ["gallery", "albums", "detail", slug] as const,
    },

    images: {
        all: () => ["gallery", "images"] as const,
        lists: () => ["gallery", "images", "list"] as const,
        list: (filters: ImageFilters) =>
            ["gallery", "images", "list", filters] as const,
        detail: (id: number) => ["gallery", "images", "detail", id] as const,
    },
} as const;

// ─── Filter shapes ────────────────────────────────────────────────────────────
export interface AlbumFilters {
    program?: string;
    event?: string;
    is_featured?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface ImageFilters {
    album?: string;
    is_featured?: boolean;
    tags?: string;
    page?: number;
    page_size?: number;
}

const multipart = { "Content-Type": "multipart/form-data" };

// ─── Gallery Albums ───────────────────────────────────────────────────────────
export const galleryAlbumService = {
    list(filters: AlbumFilters = {}) {
        return api
            .get<PaginatedResponse<GalleryAlbumList>>("/gallery/albums/", {
                params: filters,
            })
            .then((r) => r.data);
    },

    get(slug: string) {
        return api
            .get<GalleryAlbumDetail>(`/gallery/albums/${slug}/`)
            .then((r) => r.data);
    },

    featured() {
        return api
            .get<GalleryAlbumList[]>("/gallery/albums/featured/")
            .then((r) => r.data);
    },

    create(data: GalleryAlbumWrite) {
        const body = toBody(data, ["cover_image"]);
        const headers = body instanceof FormData ? multipart : undefined;
        return api
            .post<GalleryAlbumDetail>("/gallery/albums/", body, { headers })
            .then((r) => r.data);
    },

    update(slug: string, data: Partial<GalleryAlbumWrite>) {
        const body = toBody(data, ["cover_image"]);
        const headers = body instanceof FormData ? multipart : undefined;
        return api
            .patch<GalleryAlbumDetail>(`/gallery/albums/${slug}/`, body, { headers })
            .then((r) => r.data);
    },

    delete(slug: string) {
        return api.delete(`/gallery/albums/${slug}/`);
    },

    togglePublish(slug: string) {
        return api
            .post<{ detail: string; is_published: boolean }>(
                `/gallery/albums/${slug}/publish/`
            )
            .then((r) => r.data);
    },
};

// ─── Gallery Images ───────────────────────────────────────────────────────────
export const galleryImageService = {
    list(filters: ImageFilters = {}) {
        return api
            .get<PaginatedResponse<GalleryImage>>("/gallery/images/", {
                params: filters,
            })
            .then((r) => r.data);
    },

    get(id: number) {
        return api
            .get<GalleryImage>(`/gallery/images/${id}/`)
            .then((r) => r.data);
    },

    create(data: GalleryImageWrite) {
        const body = toBody(data, ["image"]);
        return api
            .post<GalleryImage>("/gallery/images/", body, { headers: multipart })
            .then((r) => r.data);
    },

    update(id: number, data: Partial<GalleryImageWrite>) {
        const body = toBody(data, ["image"]);
        const headers = body instanceof FormData ? multipart : undefined;
        return api
            .patch<GalleryImage>(`/gallery/images/${id}/`, body, { headers })
            .then((r) => r.data);
    },

    delete(id: number) {
        return api.delete(`/gallery/images/${id}/`);
    },
};