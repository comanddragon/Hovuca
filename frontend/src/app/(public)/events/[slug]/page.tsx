"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, isPast, isFuture, formatDistanceToNow } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import {
    MapPin, Globe, Users, Clock, Calendar, Wifi,
    ArrowLeft, CalendarDays, ExternalLink, Share2,
    CheckCircle2, XCircle, AlertCircle, Timer,
    ChevronLeft, ChevronRight,
} from "lucide-react";

import { useEvent, useRegisterForEvent, useUnregisterFromEvent } from "@/hooks";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth.store";
import type { EventDetail } from "@/types";
import { authPath } from "@/lib/auth-return";

/* ─── Hero Slideshow ──────────────────────────────────────────── */

function HeroSlideshow({ slides }: { slides: { src: string; alt: string }[] }) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);

    const prev = useCallback(() =>
        setCurrent(i => (i - 1 + slides.length) % slides.length), [slides.length]);
    const next = useCallback(() =>
        setCurrent(i => (i + 1) % slides.length), [slides.length]);

    // Auto-advance every 5 s
    useEffect(() => {
        if (slides.length <= 1 || paused) return;
        const id = setInterval(next, 5000);
        return () => clearInterval(id);
    }, [slides.length, paused, next]);

    // Keyboard nav
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [prev, next]);

    if (slides.length === 0) return null;

    return (
        <div
            className="absolute inset-0"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Slides */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={current}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <Image
                        src={slides[current].src}
                        alt={slides[current].alt}
                        fill
                        priority={current === 0}
                        loading={current === 0 ? "eager" : "lazy"}
                        sizes="100vw"
                        className="object-cover opacity-60"
                    />
                </motion.div>
            </AnimatePresence>

            {/* Arrows — only shown when multiple slides */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === current
                                        ? "w-6 bg-white"
                                        : "w-1.5 bg-white/40 hover:bg-white/60"
                                }`}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── helpers ─────────────────────────────────────────────────── */

function EventTypeBadge({ type }: { type: EventDetail["event_type"] }) {
    const map = {
        in_person: { label: "In Person", icon: MapPin, color: "bg-green-500/10 text-green-600 border-green-500/20" },
        online:    { label: "Online",    icon: Wifi,   color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        hybrid:    { label: "Hybrid",    icon: Globe,  color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    };
    const { label, icon: Icon, color } = map[type];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${color}`}>
            <Icon className="h-3.5 w-3.5" />{label}
        </span>
    );
}

function RegistrationStatus({ event }: { event: EventDetail }) {
    const { isAuthenticated } = useAuthStore();
    const { mutate: register, isPending: registering } = useRegisterForEvent(event.slug);
    const { mutate: unregister, isPending: unregistering } = useUnregisterFromEvent(event.slug);

    const ended = isPast(new Date(event.end_date));
    const deadlinePassed = event.registration_deadline
        ? isPast(new Date(event.registration_deadline))
        : false;

    const handleRegister = () => {
        register(undefined, {
            onSuccess: (data) => {
                const msg = data?.status === "waitlisted"
                    ? "You've been added to the waitlist."
                    : "You're registered! See you there.";
                toast.success(msg);
            },
            onError: () => toast.error("Registration failed. Please try again."),
        });
    };

    const handleUnregister = () => {
        unregister(undefined, {
            onSuccess: () => toast.success("You've been unregistered from this event."),
            onError: () => toast.error("Could not unregister. Please try again."),
        });
    };

    if (ended) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                This event has ended.
            </div>
        );
    }

    if (!event.is_registration_required) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                No registration required — just show up!
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Sign in to register for this event.</p>
                <Link href={authPath("/login", `/events/${event.slug}`)}>
                    <Button className="w-full" size="lg">Sign in to register</Button>
                </Link>
            </div>
        );
    }

    if (event.is_registered) {
        const reg = event.my_registration;
        const isWaitlisted = reg?.status === "waitlisted";
        return (
            <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    isWaitlisted
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                        : "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                }`}>
                    {isWaitlisted
                        ? <><Timer className="h-4 w-4 shrink-0" />{`You're on the waitlist.`}</>
                        : <><CheckCircle2 className="h-4 w-4 shrink-0" />{`You're registered!`}</>
                    }
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={unregistering}
                    onClick={handleUnregister}
                >
                    {unregistering ? "Cancelling…" : "Cancel registration"}
                </Button>
            </div>
        );
    }

    if (deadlinePassed) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 shrink-0" />
                Registration deadline has passed.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {event.is_full && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {`Event is full — you'll be added to the waitlist.`}
                </div>
            )}
            <Button
                size="lg"
                className="w-full"
                disabled={registering}
                onClick={handleRegister}
            >
                {registering ? "Registering…" : event.is_full ? "Join waitlist" : "Register now"}
            </Button>
            {event.registration_deadline && (
                <p className="text-center text-xs text-muted-foreground">
                    Registration closes {format(new Date(event.registration_deadline), "MMM d, yyyy · h:mm a")}
                </p>
            )}
        </div>
    );
}

/* ─── Build slides from cover + extra images ──────────────────── */

function buildSlides(event: EventDetail): { src: string; alt: string }[] {
    const slides: { src: string; alt: string }[] = [];

    // Primary cover first
    if (event.cover_image) {
        slides.push({
            src: event.cover_image,
            alt: event.cover_image_alt || event.title,
        });
    }

    // Extra images in order
    for (const img of event.images ?? []) {
        slides.push({ src: img.image, alt: img.alt_text || event.title });
    }

    return slides;
}

/* ─── page ─────────────────────────────────────────────────────── */

export default function EventDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const { data: event, isLoading, isError } = useEvent(slug);

    const handleShare = () => {
        void navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard.");
    };

    if (isLoading) return <PageLoader />;

    if (isError || !event) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                <h2 className="text-xl font-semibold text-foreground">Event not found</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    This event may have been removed or the link is incorrect.
                </p>
                <Button variant="outline" onClick={() => router.push("/events")}>
                    Back to events
                </Button>
            </div>
        );
    }

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const ended = isPast(endDate);
    const upcoming = isFuture(startDate);
    const timeUntil = upcoming ? formatDistanceToNow(startDate, { addSuffix: true }) : null;
    const slides = buildSlides(event);

    return (
        <div className="min-h-screen bg-background pb-24">

            {/* ── HERO ────────────────────────────────────────────────── */}
            <div className="relative h-[45vh] min-h-[320px] max-h-[520px] bg-neutral-950 overflow-hidden">

                {slides.length > 0 ? (
                    <HeroSlideshow slides={slides} />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-neutral-950" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />

                {/* Back button */}
                <motion.div
                    className="absolute top-6 left-4 sm:left-8 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
                    >
                        <ArrowLeft className="h-4 w-4" /> Events
                    </Button>
                </motion.div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 pointer-events-none">
                    <motion.div
                        className="mx-auto max-w-4xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="flex flex-wrap gap-2 mb-3 pointer-events-auto">
                            <EventTypeBadge type={event.event_type} />
                            {event.category && (
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                                    style={{ backgroundColor: event.category.color }}
                                >
                                    {event.category.name}
                                </span>
                            )}
                            {event.is_featured && (
                                <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                                    Featured
                                </span>
                            )}
                            {ended && (
                                <span className="inline-flex items-center rounded-full bg-muted/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                                    Ended
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white leading-snug mb-2 max-w-3xl">
                            {event.title}
                        </h1>

                        {timeUntil && (
                            <p className="text-sm text-primary/80 font-medium">
                                Starting {timeUntil}
                            </p>
                        )}

                        {/* Slide counter when multiple images */}
                        {slides.length > 1 && (
                            <p className="mt-1 text-xs text-white/30">
                                {slides.length} photos
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── BODY ────────────────────────────────────────────────── */}
            <div className="mx-auto max-w-4xl px-4 sm:px-8 py-10">
                <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

                    {/* Left — main content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Quick meta */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Calendar className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Date & Time</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {format(startDate, "EEE, MMMM d, yyyy")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {format(startDate, "h:mm a")} — {format(endDate, "h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {event.event_type !== "online" && event.location_name && (
                                <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <MapPin className="h-4.5 w-4.5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                                        <p className="text-sm font-medium text-foreground">{event.location_name}</p>
                                        {event.location_address && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {event.location_address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(event.event_type === "online" || event.event_type === "hybrid") && event.online_url && (
                                <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <Wifi className="h-4.5 w-4.5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Online link</p>
                                        <a
                                            href={event.online_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                        >
                                            Join meeting <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Users className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Attendees</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {event.attendee_count} registered
                                    </p>
                                    {event.max_attendees && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {event.is_full
                                                ? "Event is full"
                                                : `${event.max_attendees - event.attendee_count} spots left`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        {event.description && (
                            <div>
                                <h2 className="text-lg font-semibold text-foreground mb-4">About this event</h2>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed
                                        prose-headings:text-foreground prose-headings:font-semibold
                                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                        prose-strong:text-foreground"
                                    dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                            </div>
                        )}

                        {/* Organiser */}
                        {event.organizer_name && (
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                    {event.organizer_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Organised by</p>
                                    <p className="text-sm font-medium text-foreground">{event.organizer_name}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right — sticky sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="sticky top-24 space-y-4">
                            {/* Registration card */}
                            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {format(startDate, "EEE, MMM d · h:mm a")}
                                    </div>
                                    <p className="text-2xl font-display font-semibold text-foreground leading-tight">
                                        {event.is_registration_required ? "Register" : "Free entry"}
                                    </p>
                                </div>

                                <RegistrationStatus event={event} />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full gap-2 text-muted-foreground"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4" /> Share event
                                </Button>
                            </div>

                            {/* Capacity bar */}
                            {event.max_attendees && (
                                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Capacity</span>
                                        <span className="font-medium text-foreground">
                                            {event.attendee_count} / {event.max_attendees}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                event.is_full ? "bg-destructive" : "bg-primary"
                                            }`}
                                            style={{ width: `${Math.min((event.attendee_count / event.max_attendees) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {event.is_full
                                            ? "No spots remaining — join the waitlist"
                                            : `${event.max_attendees - event.attendee_count} spots remaining`}
                                    </p>
                                </div>
                            )}

                            {/* Add to calendar */}
                            {!ended && (
                                <a
                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(event.excerpt ?? "")}&location=${encodeURIComponent(event.location_name ?? "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Add to Google Calendar
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
