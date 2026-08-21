"use client";

import { useState, useEffect, useCallback } from "react";
import { useGalleryAlbums, useFeaturedAlbums } from "@/hooks";
import { PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import {
    Images, Search, Calendar, X, ChevronLeft,
    ChevronRight, Eye, ImageIcon, Star
} from "lucide-react";
import { format } from "date-fns";
import type { GalleryAlbumList, GalleryImage } from "@/types";

const PAGE_SIZE = 12;

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
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                {/* Close */}
                <button
                    className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50 tracking-widest uppercase">
                    {index + 1} / {images.length}
                </div>

                {/* Prev */}
                <button
                    className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Image */}
                <motion.div
                    key={image.id}
                    className="relative max-h-[85vh] max-w-[90vw] w-full flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative w-full" style={{ maxHeight: "80vh", aspectRatio: "16/10" }}>
                        <Image
                            src={image.image}
                            alt={image.alt_text || image.title}
                            fill
                            sizes="90vw"
                            className="object-contain"
                        />
                    </div>

                    {/* Caption */}
                    {(image.title || image.caption) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4 rounded-b-xl">
                            {image.title && <p className="text-white font-medium text-sm">{image.title}</p>}
                            {image.caption && <p className="text-white/60 text-xs mt-0.5">{image.caption}</p>}
                        </div>
                    )}
                </motion.div>

                {/* Next */}
                <button
                    className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors z-10"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Album Card ───────────────────────────────────────────────────────────────
function AlbumCard({ album, index }: { album: GalleryAlbumList; index: number }) {
    const cover = album.effective_cover || album.cover_image;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
            viewport={{ once: false, margin: "-50px" }}
            className="group"
        >
            <Link href={`/gallery/${album.slug}`} className="block rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                {/* Cover */}
                <div className="relative h-52 bg-gradient-to-br from-muted to-muted/50">
                    {cover ? (
                        <Image
                            src={cover}
                            alt={album.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <Images className="h-12 w-12 text-primary/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Image count chip */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-white text-xs">
                        <ImageIcon className="h-3 w-3" />
                        {album.image_count} photos
                    </div>

                    {album.is_featured && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-0.5 text-white text-[10px] font-bold uppercase tracking-wide">
                            <Star className="h-2.5 w-2.5" />
                            Featured
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4">
                    <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {album.title}
                    </h3>
                    {album.description && (
                        <p className="text-sm text-muted-foreground font-light line-clamp-2 leading-relaxed mb-3">
                            {album.description}
                        </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {album.taken_at
                                ? format(new Date(album.taken_at), "MMM d, yyyy")
                                : format(new Date(album.created_at), "MMM d, yyyy")}
                        </div>
                        <span className="text-primary group-hover:translate-x-1 transition-transform duration-200">
                            View →
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [lightbox, setLightbox] = useState<{ images: GalleryImage[]; index: number } | null>(null);

    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data, isLoading } = useGalleryAlbums({ search, page, page_size: PAGE_SIZE });
    const { data: featured = [] } = useFeaturedAlbums();

    const albums = data?.results ?? [];
    const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 1;

    const closeLightbox = useCallback(() => setLightbox(null), []);
    const nextImage = useCallback(() => {
        if (!lightbox) return;
        setLightbox(l => l ? { ...l, index: (l.index + 1) % l.images.length } : null);
    }, [lightbox]);
    const prevImage = useCallback(() => {
        if (!lightbox) return;
        setLightbox(l => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : null);
    }, [lightbox]);

    return (
        <div className="min-h-screen pb-28 bg-background">

            {/* Lightbox */}
            {lightbox && (
                <Lightbox
                    images={lightbox.images}
                    index={lightbox.index}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[65vh] items-center justify-center overflow-hidden bg-neutral-950">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1531685250784-7569952593d2?w=1600&q=80')",
                        y: heroY,
                        opacity: 0.2,
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(123,82,171,0.75)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 via-transparent to-neutral-950/80" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <motion.div
                    className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
                    style={{ opacity: heroOpacity }}
                >
                    <motion.p
                        className="mb-6 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/40"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className="block w-6 h-px bg-primary/60" />
                        Our Memories
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Photo{" "}
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Gallery
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-lg text-base text-white/50 font-light leading-relaxed mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        Moments captured across our programs, events, and communities.
                    </motion.p>

                    <motion.div
                        className="mx-auto max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <input
                                placeholder="Search albums…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full rounded-sm border border-white/15 bg-white/8 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">Scroll</span>
                    <motion.div
                        className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent"
                        style={{ originY: 0 }}
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </section>

            {/* ── FEATURED STRIP ────────────────────────────────────────── */}
            {featured.length > 0 && (
                <div className="border-b border-border bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false }}
                        >
                            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5 font-light">
                                Featured Albums
                            </p>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {featured.map((album) => {
                                    const cover = album.effective_cover || album.cover_image;
                                    return (
                                        <Link
                                            key={album.id}
                                            href={`/gallery/${album.slug}`}
                                            className="group shrink-0 w-52 rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all"
                                        >
                                            <div className="relative h-32 bg-muted">
                                                {cover && (
                                                    <Image src={cover} alt={album.title} fill sizes="208px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-medium line-clamp-1">{album.title}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* ── ALBUMS GRID ───────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
                {isLoading ? <PageLoader /> : albums.length === 0 ? (
                    <EmptyState
                        icon={<Images className="h-12 w-12" />}
                        title="No albums found"
                        description="Try a different search term."
                    />
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {albums.map((album, i) => (
                                <AlbumCard key={album.id} album={album} index={i} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <motion.div
                                className="mt-12 flex items-center justify-center gap-2"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: false }}
                            >
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) => p === "..." ? (
                                        <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">…</span>
                                    ) : (
                                        <Button key={p} size="sm" variant={p === page ? "default" : "outline"} className="w-9" onClick={() => setPage(p as number)}>{p}</Button>
                                    ))
                                }
                                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}