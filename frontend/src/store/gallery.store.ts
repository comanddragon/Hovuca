// src/store/gallery.store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GalleryAlbumDetail, GalleryImage } from "@/types";
import type { AlbumFilters, ImageFilters } from "@/services/gallery.service";

// ─── Upload queue ─────────────────────────────────────────────────────────────
export interface UploadQueueItem {
  /** Temporary local ID (e.g. crypto.randomUUID()) */
  id: string;
  file: File;
  albumSlug: string;
  progress: number; // 0–100
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: GalleryImage;
}

// ─── State ────────────────────────────────────────────────────────────────────
interface GalleryState {
  albumFilters: AlbumFilters;
  imageFilters: ImageFilters;
  activeAlbum: GalleryAlbumDetail | null;

  // Lightbox
  lightboxOpen: boolean;
  lightboxImages: GalleryImage[];
  lightboxIndex: number;

  // Upload queue
  uploadQueue: UploadQueueItem[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
interface GalleryActions {
  setAlbumFilters: (patch: Partial<AlbumFilters>) => void;
  resetAlbumFilters: () => void;

  setImageFilters: (patch: Partial<ImageFilters>) => void;
  resetImageFilters: () => void;

  setActiveAlbum: (album: GalleryAlbumDetail | null) => void;

  openLightbox: (images: GalleryImage[], startIndex?: number) => void;
  closeLightbox: () => void;
  lightboxNext: () => void;
  lightboxPrev: () => void;

  enqueueUpload: (item: Omit<UploadQueueItem, "progress" | "status">) => void;
  updateUploadItem: (id: string, patch: Partial<UploadQueueItem>) => void;
  removeUploadItem: (id: string) => void;
  clearUploadQueue: () => void;
}

export const useGalleryStore = create<GalleryState & GalleryActions>()(
  devtools(
    (set) => ({
      // State
      albumFilters: { page: 1, page_size: 12 },
      imageFilters: { page: 1, page_size: 24 },
      activeAlbum: null,
      lightboxOpen: false,
      lightboxImages: [],
      lightboxIndex: 0,
      uploadQueue: [],

      // Album filters
      setAlbumFilters: (patch) =>
        set(
          (s) => ({ albumFilters: { ...s.albumFilters, ...patch, page: 1 } }),
          false,
          "gallery/setAlbumFilters"
        ),
      resetAlbumFilters: () =>
        set(
          { albumFilters: { page: 1, page_size: 12 } },
          false,
          "gallery/resetAlbumFilters"
        ),

      // Image filters
      setImageFilters: (patch) =>
        set(
          (s) => ({ imageFilters: { ...s.imageFilters, ...patch, page: 1 } }),
          false,
          "gallery/setImageFilters"
        ),
      resetImageFilters: () =>
        set(
          { imageFilters: { page: 1, page_size: 24 } },
          false,
          "gallery/resetImageFilters"
        ),

      // Active album
      setActiveAlbum: (album) =>
        set({ activeAlbum: album }, false, "gallery/setActiveAlbum"),

      // Lightbox
      openLightbox: (images, startIndex = 0) =>
        set(
          { lightboxOpen: true, lightboxImages: images, lightboxIndex: startIndex },
          false,
          "gallery/openLightbox"
        ),
      closeLightbox: () =>
        set({ lightboxOpen: false }, false, "gallery/closeLightbox"),
      lightboxNext: () =>
        set(
          (s) => ({
            lightboxIndex: (s.lightboxIndex + 1) % s.lightboxImages.length,
          }),
          false,
          "gallery/next"
        ),
      lightboxPrev: () =>
        set(
          (s) => ({
            lightboxIndex:
              (s.lightboxIndex - 1 + s.lightboxImages.length) %
              s.lightboxImages.length,
          }),
          false,
          "gallery/prev"
        ),

      // Upload queue
      enqueueUpload: (item) =>
        set(
          (s) => ({
            uploadQueue: [
              ...s.uploadQueue,
              { ...item, progress: 0, status: "pending" },
            ],
          }),
          false,
          "gallery/enqueue"
        ),
      updateUploadItem: (id, patch) =>
        set(
          (s) => ({
            uploadQueue: s.uploadQueue.map((i) =>
              i.id === id ? { ...i, ...patch } : i
            ),
          }),
          false,
          "gallery/updateItem"
        ),
      removeUploadItem: (id) =>
        set(
          (s) => ({
            uploadQueue: s.uploadQueue.filter((i) => i.id !== id),
          }),
          false,
          "gallery/removeItem"
        ),
      clearUploadQueue: () =>
        set({ uploadQueue: [] }, false, "gallery/clearQueue"),
    }),
    { name: "GalleryStore" }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAlbumFilters = (s: GalleryState) => s.albumFilters;
export const selectImageFilters = (s: GalleryState) => s.imageFilters;
export const selectActiveAlbum = (s: GalleryState) => s.activeAlbum;
export const selectLightbox = (s: GalleryState) => ({
  open: s.lightboxOpen,
  images: s.lightboxImages,
  index: s.lightboxIndex,
});
export const selectUploadQueue = (s: GalleryState) => s.uploadQueue;
export const selectPendingUploads = (s: GalleryState) =>
  s.uploadQueue.filter((i) => i.status !== "done");
