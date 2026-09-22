"use client";

import { useState, useEffect } from "react";
import type { EventList, EventCategory } from "@/types";
import { useEvents, useEventCategories } from "@/hooks";
import { PageLoader, EmptyState, Pagination } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
    MapPin, Globe, Users, Clock,
    Search, ArrowRight, CalendarDays, Wifi
} from "lucide-react";
import { format, isPast } from "date-fns";

const PAGE_SIZE = 9;

function EventTypeBadge({ type }: { type: EventList["event_type"] }) {
    const map = {
        in_person: { label: "In Person", icon: MapPin, color: "bg-green-500/10 text-green-600 border-green-500/20" },
        online: { label: "Online", icon: Wifi, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        hybrid: { label: "Hybrid", icon: Globe, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    };
    const { label, icon: Icon, color } = map[type];
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${color}`}>
            <Icon className="h-3 w-3" />{label}
        </span>
    );
}

function StatusBadge({ status }: { status: EventList["status"] }) {
    const map = {
        draft: "bg-muted text-muted-foreground",
        published: "bg-primary/10 text-primary",
        cancelled: "bg-destructive/10 text-destructive",
        completed: "bg-muted text-muted-foreground",
    };
    return (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
            {status}
        </span>
    );
}

function EventCard({ event, index }: { event: EventList; index: number }) {
    const startDate = new Date(event.start_date);
    const ended = isPast(new Date(event.end_date));

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
            viewport={{ once: false, margin: "-50px" }}
            className="group"
        >
            <Link href={`/events/${event.slug}`} className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                {/* Cover */}
                <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 shrink-0">
                    {event.cover_image ? (
                        <Image
                            src={event.cover_image}
                            alt={event.cover_image_alt || event.title}
                            fill
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                            <CalendarDays className="h-12 w-12 text-primary/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Date chip */}
                    <div className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-sm shadow-sm px-3 py-2 min-w-[52px] text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary leading-none">
                            {format(startDate, "MMM")}
                        </span>
                        <span className="text-xl font-bold text-foreground leading-tight">
                            {format(startDate, "d")}
                        </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        {event.is_featured && (
                            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                                Featured
                            </span>
                        )}
                        {event.is_full && (
                            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                                Full
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <EventTypeBadge type={event.event_type} />
                        {event.category && (
                            <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                                style={{ backgroundColor: event.category.color }}
                            >
                                {event.category.name}
                            </span>
                        )}
                        {ended && <StatusBadge status="completed" />}
                    </div>

                    <h3 className="mb-2 font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug">
                        {event.title}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2 font-light leading-relaxed">
                        {event.excerpt}
                    </p>

                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{format(startDate, "EEE, MMM d · h:mm a")}</span>
                        </div>
                        {event.location_name && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{event.location_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span>{event.attendee_count} attending</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground font-light">
                            {event.organizer_name ?? "HOVUCA"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export function EventsView() {
    const [search, setSearch] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [eventType, setEventType] = useState("");
    const [page, setPage] = useState(1);
    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data, isLoading, isFetching } = useEvents({
        search,
        category: categorySlug,
        event_type: eventType || undefined,
        page,
        page_size: PAGE_SIZE,
    });
    const { data: categoriesData } = useEventCategories();
    const categories = categoriesData?.results ?? [];

    const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : page;
    const events = data?.results ?? [];

    if (isLoading) return <PageLoader />;

    return (
        <div className="min-h-screen pb-28 bg-background">
            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[65vh] items-center justify-center overflow-hidden bg-neutral-950">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80')",
                        y: heroY,
                        opacity: 0.2,
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--brand-overlay-purple-75)_100%)]" />
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
                        Hovuca Events
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Events &{" "}
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Gatherings
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-lg text-base text-white/50 font-light leading-relaxed mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        Connect, learn, and grow with our community. Join workshops, forums, and impact events across Cameroon.
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
                                placeholder="Search events…"
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

            {/* ── CONTENT ───────────────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
                {/* Filters */}
                <motion.div
                    className="mb-10 flex flex-wrap gap-2 items-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: false }}
                >
                    <Button
                        size="sm" variant={categorySlug === "" ? "default" : "outline"}
                        onClick={() => { setCategorySlug(""); setPage(1); }}
                        className="rounded-full text-xs px-4"
                    >All</Button>
                    {categories.map((cat: EventCategory) => (
                        <Button
                            key={cat.slug} size="sm"
                            variant={categorySlug === cat.slug ? "default" : "outline"}
                            onClick={() => { setCategorySlug(cat.slug); setPage(1); }}
                            className="rounded-full text-xs px-4"
                            style={categorySlug === cat.slug ? {} : { borderColor: cat.color, color: cat.color }}
                        >
                            {cat.name}
                        </Button>
                    ))}

                    <span className="w-px h-5 bg-border mx-1" />

                    {["in_person", "online", "hybrid"].map((t) => (
                        <Button
                            key={t} size="sm"
                            variant={eventType === t ? "default" : "ghost"}
                            onClick={() => { setEventType(eventType === t ? "" : t); setPage(1); }}
                            className="rounded-full text-xs px-4 capitalize"
                        >
                            {t.replace("_", " ")}
                        </Button>
                    ))}
                </motion.div>

                {/* Grid */}
                {events.length === 0 && !isFetching ? (
                    <EmptyState
                        icon={<CalendarDays className="h-12 w-12" />}
                        title="No events found"
                        description="Try different filters or check back later."
                    />
                ) : (
                    <>
                        <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                            {events.map((event, i) => (
                                <EventCard key={event.id} event={event} index={i} />
                            ))}
                        </div>

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            className="mt-12"
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default EventsView;
