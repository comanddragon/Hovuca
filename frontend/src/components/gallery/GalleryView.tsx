"use client";

import { useState } from "react";
import { useGalleryAlbums } from "@/hooks";
import { PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Images, Search, ArrowUpRight, Calendar, Star, X } from "lucide-react";
import { format } from "date-fns";
import type { GalleryAlbumList } from "@/types";
import "./gallery.css";

const PAGE_SIZE = 12;

function AlbumCard({ album, index }: { album: GalleryAlbumList; index: number }) {
    const cover = album.effective_cover || album.cover_image;
    return (
        <Link href={`/gallery/${album.slug}`} className="gallery-album group">
            <div className="gallery-album-photo">
                {cover ? <Image src={cover} alt={album.title} width={1200} height={800}
                    loading={index < 2 ? "eager" : "lazy"}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 25vw"
                    className="gallery-natural-image" /> :
                    <div className="gallery-missing-photo"><Images aria-hidden="true" className="h-10 w-10" /></div>}
                {album.is_featured && <span className="gallery-featured"><Star aria-hidden="true" className="h-3 w-3" />Featured</span>}
            </div>
            <div className="gallery-album-caption">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight">{album.title}</h2>
                    <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                </div>
                {album.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{album.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span>{album.image_count} {album.image_count === 1 ? "photo" : "photos"}</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar aria-hidden="true" className="h-3.5 w-3.5" />{format(new Date(album.taken_at || album.created_at), "MMM d, yyyy")}</span>
                </div>
            </div>
        </Link>
    );
}

export function GalleryView() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data, isLoading, isError, refetch } = useGalleryAlbums({ search, page, page_size: PAGE_SIZE });
    const albums = data?.results ?? [];
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

    return (
        <div className="gallery-page min-h-screen bg-background pb-20">
            <header className="gallery-heading">
                <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">Photo gallery</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">Moments captured across our programs, events, and communities.</p>
            </header>
            <section aria-label="Gallery albums" className="gallery-section">
                <div className="gallery-toolbar">
                    <p aria-live="polite" className="text-sm text-muted-foreground">{isLoading ? "Loading albums…" : `${data?.count ?? 0} ${data?.count === 1 ? "album" : "albums"}`}</p>
                    <div className="relative w-full sm:w-80">
                        <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input aria-label="Search albums" placeholder="Search albums…" value={search}
                            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                            className="h-12 w-full border border-border bg-background pl-10 pr-12 text-sm focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" />
                        {search && <button aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-muted-foreground"><X className="h-4 w-4" /></button>}
                    </div>
                </div>
                {isLoading ? <PageLoader /> : isError ? (
                    <div className="py-20 text-center"><p className="mb-4 text-muted-foreground">We couldn’t load the gallery.</p><Button onClick={() => refetch()}>Try again</Button></div>
                ) : albums.length === 0 ? <EmptyState icon={<Images className="h-12 w-12" />} title="No albums found" description={search ? "Try a different search term." : "New photo collections will appear here."} /> : (
                    <div className="gallery-masonry">{albums.map((album, index) => <AlbumCard key={album.id} album={album} index={index} />)}</div>
                )}
                {totalPages > 1 && <nav aria-label="Gallery pagination" className="mt-12 flex flex-wrap items-center justify-center gap-4">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </nav>}
            </section>
        </div>
    );
}

export default GalleryView;
