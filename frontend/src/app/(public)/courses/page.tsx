"use client";

import { useState, useEffect } from "react";
import { useCourses } from "@/hooks";
import { PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import { BookOpen, Clock, Search, Users, ArrowRight, GraduationCap, Zap } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { Course } from "@/types";

const LEVELS = ["", "beginner", "intermediate", "advanced"] as const;

const LEVEL_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    beginner:     { label: "Beginner",     color: "text-green-600 bg-green-500/10 border-green-500/20",  dot: "bg-green-500" },
    intermediate: { label: "Intermediate", color: "text-blue-600 bg-blue-500/10 border-blue-500/20",    dot: "bg-blue-500" },
    advanced:     { label: "Advanced",     color: "text-purple-600 bg-purple-500/10 border-purple-500/20", dot: "bg-purple-500" },
};

function CourseCard({ course, index }: { course: Course; index: number }) {
    const level = LEVEL_CONFIG[course.level];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
            viewport={{ once: false, margin: "-50px" }}
            className="group pb-28"
        >
            <Link
                href={`/courses/${course.slug}`}
                className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
            >
                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-primary/10 via-primary/5 to-blue-500/10 shrink-0">
                    {course.thumbnail ? (
                        <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <GraduationCap className="h-14 w-14 text-primary/15" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badges */}
                    <div className="absolute left-3 top-3 flex gap-2">
                        {level && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${level.color}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
                                {level.label}
                            </span>
                        )}
                        {course.is_free && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
                                <Zap className="h-2.5 w-2.5" /> Free
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                    <h3 className="mb-2 font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug">
                        {course.title}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2 font-light leading-relaxed">
                        {course.description}
                    </p>

                    {/* Instructor */}
                    {course.instructor && (
                        <div className="mb-4 flex items-center gap-2">
                            <Avatar className="h-6 w-6 ring-1 ring-border">
                                <AvatarImage src={getAvatarUrl(course.instructor.avatar) ?? undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(course.instructor.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground font-light">{course.instructor.full_name}</span>
                        </div>
                    )}

                    {/* Footer meta */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {course.duration_hours}h
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {course.enrollment_count.toLocaleString()}
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("");

    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data, isLoading } = useCourses({
        ...(search && { search }),
        ...(level && { level }),
    });

    const courses = data?.results ?? [];

    return (
        <div className="min-h-screen bg-background">

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[65vh] items-center justify-center overflow-hidden bg-neutral-950">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80')",
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
                        Learn & Grow
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Free{" "}
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Courses
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-lg text-base text-white/50 font-light leading-relaxed mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        Learn at your own pace with expert-led courses in tech, health, and leadership — all free.
                    </motion.p>

                    {/* Search */}
                    <motion.div
                        className="mx-auto max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <input
                                placeholder="Search courses…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-sm border border-white/15 bg-white/8 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
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

                {/* Level filters */}
                <motion.div
                    className="mb-10 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: false }}
                >
                    {LEVELS.map((l) => (
                        <Button
                            key={l || "all"}
                            size="sm"
                            variant={level === l ? "default" : "outline"}
                            onClick={() => setLevel(l)}
                            className="rounded-full text-xs px-4 capitalize"
                        >
                            {l || "All"}
                        </Button>
                    ))}
                </motion.div>

                {/* Grid */}
                {isLoading ? <PageLoader /> : courses.length === 0 ? (
                    <EmptyState
                        icon={<BookOpen className="h-12 w-12" />}
                        title="No courses found"
                        description="Try a different search or filter."
                    />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course, index) => (
                            <CourseCard key={course.id} course={course} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}