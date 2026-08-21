"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useGalleryAlbum } from "@/hooks";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, X, ChevronLeft, ChevronRight,
    ImageIcon, Calendar, Star, Download,
    Grid3x3, LayoutList, Eye, Tag,
} from "lucide-react";
import { format } from "date-fns";
import type { GalleryImage } from "@/types";

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
                      images, index, onClose, onNext, onPrev,
                  }: {
    images: GalleryImage[];
    index: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}) {
    const image = images[index];

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") onNext();
            if (e.key === "ArrowLeft") onPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, onNext, onPrev]);

    if (!image) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/97 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-20 bg-gradient-to-b from-black/60 to-transparent">
                    <span className="text-xs text-white/40 tracking-widest uppercase">
                        {index + 1} / {images.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <a
                            href={image.image}
                            download
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                        <button
                            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Prev */}
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition-colors z-10"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Image */}
                <motion.div
                    key={image.id}
                    className="relative flex items-center justify-center px-16"
                    style={{ maxWidth: "90vw", maxHeight: "85vh", width: "100%", height: "100%" }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative w-full" style={{ maxHeight: "78vh", aspectRatio: "16/10" }}>
                        <Image
                            src={image.image}
                            alt={image.alt_text || image.title || "Gallery image"}
                            fill
                            sizes="85vw"
                            className="object-contain"
                            priority
                        />
                    </div>
                </motion.div>

                {/* Next */}
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25 transition-colors z-10"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                {/* Bottom caption */}
                {(image.title || image.caption || image.tags?.length > 0) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-8 py-6 z-20">
                        {image.title && (
                            <p className="text-white font-medium text-sm mb-1">{image.title}</p>
                        )}
                        {image.caption && (
                            <p className="text-white/50 text-xs font-light mb-2">{image.caption}</p>
                        )}
                        {image.tags?.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {image.tags.map((tag) => (
                                    <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Thumbnail strip */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 max-w-lg overflow-x-auto pb-1">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={(e) => { e.stopPropagation(); /* handled by parent state */ }}
                            className={`relative shrink-0 h-10 w-14 rounded overflow-hidden transition-all ${
                                i === index ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"
                            }`}
                        >
                            <Image src={img.thumbnail || img.image} alt="" fill sizes="56px" className="object-cover" />
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GalleryAlbumPage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: album, isLoading } = useGalleryAlbum(slug);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [view, setView] = useState<"grid" | "masonry">("grid");

    const images = album?.images ?? [];
    const cover = album?.effective_cover || album?.cover_image;

    const openLightbox = (i: number) => setLightboxIndex(i);
    const closeLightbox = useCallback(() => setLightboxIndex(null), []);
    const nextImage = useCallback(() => {
        setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
    }, [images.length]);
    const prevImage = useCallback(() => {
        setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
    }, [images.length]);

    if (isLoading) return <PageLoader />;
    if (!album) return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-muted-foreground font-light">Album not found.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <Lightbox
                    images={images}
                    index={lightboxIndex}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <div className="relative w-full h-[50vh] min-h-[380px] overflow-hidden bg-neutral-950">
                {cover ? (
                    <Image
                        src={cover}
                        alt={album.title}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover opacity-45"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-neutral-900 to-neutral-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />

                {/* Back button */}
                <motion.div
                    className="absolute top-6 left-6 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link href="/gallery">
                        <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Gallery
                        </Button>
                    </Link>
                </motion.div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {album.is_featured && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                                    <Star className="h-2.5 w-2.5" /> Featured
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] text-white/70">
                                <ImageIcon className="h-3 w-3" />
                                {album.image_count} photos
                            </span>
                            {album.taken_at && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] text-white/70">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(album.taken_at), "MMMM d, yyyy")}
                                </span>
                            )}
                        </div>

                        <h1
                            className="font-display font-light text-white leading-tight tracking-tight"
                            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                        >
                            {album.title}
                        </h1>

                        {album.description && (
                            <p className="mt-2 text-white/50 font-light text-sm max-w-xl leading-relaxed">
                                {album.description}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── TOOLBAR ───────────────────────────────────────────────── */}
            <div className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground font-light">
                        <span className="font-medium text-foreground">{images.length}</span> photos
                    </p>
                    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                        <button
                            onClick={() => setView("grid")}
                            className={`rounded-md p-1.5 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Grid3x3 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setView("masonry")}
                            className={`rounded-md p-1.5 transition-colors ${view === "masonry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── PHOTO GRID ────────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 pb-24">
                {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-light">No photos in this album yet.</p>
                    </div>
                ) : view === "grid" ? (
                    /* Uniform grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((image, i) => (
                            <motion.button
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35, delay: (i % 8) * 0.04 }}
                                viewport={{ once: false, margin: "-40px" }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => openLightbox(i)}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                            >
                                <Image
                                    src={image.thumbnail || image.image}
                                    alt={image.alt_text || image.title || ""}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </div>

                                {/* Featured star */}
                                {image.is_featured && (
                                    <div className="absolute top-2 right-2 rounded-full bg-accent/80 p-1">
                                        <Star className="h-2.5 w-2.5 text-white" />
                                    </div>
                                )}

                                {/* Caption on hover */}
                                {image.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium line-clamp-1">{image.title}</p>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    /* Masonry-style: 3 columns with varying heights */
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
                        {images.map((image, i) => (
                            <motion.button
                                key={image.id}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
                                viewport={{ once: false, margin: "-40px" }}
                                onClick={() => openLightbox(i)}
                                className="group relative w-full break-inside-avoid overflow-hidden rounded-xl bg-muted block mb-3"
                                style={{ aspectRatio: i % 3 === 0 ? "4/5" : i % 3 === 1 ? "1/1" : "4/3" }}
                            >
                                <Image
                                    src={image.thumbnail || image.image}
                                    alt={image.alt_text || image.title || ""}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {image.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium line-clamp-1">{image.title}</p>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Tags cloud if any image has tags */}
                {images.some((img) => img.tags?.length > 0) && (
                    <motion.div
                        className="mt-12 pt-8 border-t border-border"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">Tags in this album</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(images.flatMap((img) => img.tags ?? []))).map((tag) => (
                                <span key={tag} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-default">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}