import Link from "next/link";
import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useProjects } from "@/hooks";

const VISIBLE = 3; // cards shown at once

export default function FeaturedProjects() {
    const { data, isLoading } = useProjects({ status: "in_progress", page: 1, page_size: 6 });

    // Real cards, memoized
    const real = useMemo(() => (data?.results ?? []).slice(0, 6), [data]);

    // Clone-buffered track: [...tail clones, ...real, ...head clones]
    // tail clones = last VISIBLE real cards  (prepended)
    // head clones = first VISIBLE real cards (appended)
    const track = useMemo(() => {
        if (real.length === 0) return [];
        const tail = real.slice(-VISIBLE);
        const head = real.slice(0, VISIBLE);
        return [...tail, ...real, ...head];
    }, [real]);

    // active starts at VISIBLE so we're looking at the first real card
    const [active, setActive] = useState(VISIBLE);
    const [animated, setAnimated] = useState(true);
    const isJumping = useRef(false);

    const clampedNext = useCallback(() => {
        setActive((a) => a + 1);
    }, []);

    const clampedPrev = useCallback(() => {
        setActive((a) => a - 1);
    }, []);

    // Called when the spring animation finishes
    const handleAnimationComplete = useCallback(() => {
        if (isJumping.current) return;

        const lastRealIndex = VISIBLE + real.length - 1; // index of last real card in track
        const firstRealIndex = VISIBLE;                  // index of first real card in track

        // Landed on a head clone — teleport back to the matching real card
        if (active > lastRealIndex) {
            isJumping.current = true;
            setAnimated(false);
            setActive(firstRealIndex + (active - lastRealIndex - 1));
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimated(true);
                    isJumping.current = false;
                });
            });
        }

        // Landed on a tail clone — teleport forward to the matching real card
        if (active < firstRealIndex) {
            isJumping.current = true;
            setAnimated(false);
            setActive(lastRealIndex - (firstRealIndex - active - 1));
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimated(true);
                    isJumping.current = false;
                });
            });
        }
    }, [active, real.length]);

    // Dot index: which real card is currently "active"
    const dotIndex = useMemo(() => {
        const idx = (active - VISIBLE) % real.length;
        return ((idx % real.length) + real.length) % real.length;
    }, [active, real.length]);

    return (
        <section className="py-16 md:py-24 bg-neutral-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

                {/* Section header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-[clamp(1.75rem,5vw,3.5rem)] font-display font-light text-black mb-8 tracking-tight">
                        Featured Projects
                    </h2>
                    <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
                        Discover how our engagement creates lasting change in communities nationwide
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : real.length === 0 ? (
                    <div className="flex justify-center items-center h-80">
                        <p className="text-gray-500 font-light">No featured projects at the moment, please refresh the page.</p>
                    </div>
                ) : (
                    <>
                        {/* Sliding track */}
                        <div className="overflow-hidden">
                            <motion.div
                                className="flex"
                                animate={{ x: `-${active * (100 / VISIBLE)}%` }}
                                transition={
                                    animated
                                        ? { type: "spring", stiffness: 300, damping: 30 }
                                        : { duration: 0 }
                                }
                                onAnimationComplete={handleAnimationComplete}
                            >
                                {track.map((project, i) => {
                                    const imageUrl = project.cover_image ?? "/Logos/Hovuca-cropped.png";
                                    // Unique key: combine real id + position bucket to avoid key collisions
                                    // between real cards and their clones
                                    const bucket = i < VISIBLE ? "tail" : i >= VISIBLE + real.length ? "head" : "real";
                                    return (
                                        <div
                                            key={`${bucket}-${project.id}`}
                                            className="w-1/3 shrink-0 px-4"
                                            aria-hidden={bucket !== "real"}
                                        >
                                            <Link
                                                href={`/projects/${project.slug}`}
                                                tabIndex={bucket !== "real" ? -1 : undefined}
                                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full border border-neutral-200"
                                            >
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={project.title}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                </div>

                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="text-sm font-light text-gray-400 mb-2">
                                                        {new Date(project.created_at).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                    <motion.h3
                                                        whileHover={{ x: 2 }}
                                                        className="text-xl font-light text-black mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2"
                                                    >
                                                        {project.title}
                                                    </motion.h3>
                                                    <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-2 mb-4 flex-1">
                                                        {project.excerpt}
                                                    </p>

                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="text-gray-500 font-light text-[10px] uppercase tracking-wide">Progress</span>
                                                            <span className="font-medium text-black">{project.progress_percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                            <div
                                                                className="bg-black h-1.5 rounded-full transition-all duration-300"
                                                                style={{ width: `${Math.min(Number(project.progress_percentage) || 0, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button
                                onClick={clampedPrev}
                                className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex gap-2">
                                {real.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActive(VISIBLE + i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                            i === dotIndex ? "bg-neutral-900" : "bg-neutral-200"
                                        }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={clampedNext}
                                className="p-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}

                {/* CTA */}
                <div className="text-center mt-12">
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
                        <Link
                            href="/programs/projects"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-900 to-blue-900 hover:from-[hsl(262,83%,58%)] hover:to-[hsl(217,91%,60%)] text-white font-light rounded-md shadow-lg hover:shadow-xl transition-all duration-500"
                        >
                            View All our Projects
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}