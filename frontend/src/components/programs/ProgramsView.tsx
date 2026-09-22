"use client";

import { useState, useEffect } from "react";
import { usePrograms } from "@/hooks";
import { StatusBadge, PageLoader, EmptyState, Pagination } from "@/components/shared";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Search, Target, Calendar, Users, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { Program } from "@/types";

const STATUS_OPTIONS = ["", "active", "completed", "draft", "cancelled"];
const PAGE_SIZE = 5;

function ProgramCard({ program, index }: { program: Program; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            viewport={{ once: false, margin: "-60px" }}
        >
            <Link
                href={`/programs/${program.slug}`}
                className="group flex flex-col sm:flex-row rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
            >
                {/* Banner */}
                <div className="relative sm:w-80 sm:shrink-0 h-56 sm:h-auto bg-gradient-to-br from-primary/10 to-primary/5">
                    {program.banner ? (
                        <Image
                            src={program.banner}
                            alt={program.title}
                            fill
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Target className="h-14 w-14 text-primary/15" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3">
                        <StatusBadge status={program.status} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                        <h3 className="mb-2 font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug">
                            {program.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-light">
                            {program.excerpt || program.description}
                        </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-5 text-xs text-muted-foreground">
                            {program.start_date && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(program.start_date)}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                {program.target_beneficiaries.toLocaleString()} beneficiaries
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export function ProgramsView() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data, isLoading } = usePrograms({
        ...(search && { search }),
        ...(status && { status }),
        page,
        page_size: PAGE_SIZE,
    });

    const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 1;
    const programs = data?.results ?? [];

    return (
        <div className="min-h-screen pb-28 bg-background">
            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[65vh] items-center justify-center overflow-hidden bg-neutral-950">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&q=80')",
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
                        What We Do
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Our{" "}
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Programs
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-lg text-base text-white/50 font-light leading-relaxed mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        High-impact initiatives across education, health, and community development — built for lasting change.
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
                                placeholder="Search programs…"
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
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
                {/* Status filters */}
                <motion.div
                    className="mb-10 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: false }}
                >
                    {STATUS_OPTIONS.map((s) => (
                        <Button
                            key={s || "all"}
                            size="sm"
                            variant={status === s ? "default" : "outline"}
                            onClick={() => { setStatus(s); setPage(1); }}
                            className="rounded-full text-xs px-4 capitalize"
                        >
                            {s || "All"}
                        </Button>
                    ))}
                </motion.div>

                {/* Programs list */}
                {isLoading ? (
                    <PageLoader />
                ) : programs.length === 0 ? (
                    <EmptyState
                        icon={<Target className="h-12 w-12" />}
                        title="No programs found"
                        description="Try adjusting your search or filters."
                    />
                ) : (
                    <>
                        <div className="flex flex-col gap-6">
                            {programs.map((program, index) => (
                                <ProgramCard key={program.slug} program={program} index={index} />
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

export default ProgramsView;
