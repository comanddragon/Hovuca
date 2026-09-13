import Link from "next/link";
import React, { useRef, useState, useMemo, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useFeaturedArticles } from "@/hooks";

const VISIBLE = 3;

export default function BlogsCarousel() {
    const { data: articles, isLoading } = useFeaturedArticles();
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const real = useMemo(() => (articles ?? []).slice(0, 6), [articles]);

    const track = useMemo(() => {
        if (real.length === 0) return [];
        const tail = real.slice(-VISIBLE);
        const head = real.slice(0, VISIBLE);
        return [...tail, ...real, ...head];
    }, [real]);

    const [active, setActive] = useState(VISIBLE);
    const [animated, setAnimated] = useState(true);
    const isJumping = useRef(false);

    const prev = useCallback(() => setActive((a) => a - 1), []);
    const next = useCallback(() => setActive((a) => a + 1), []);

    const handleAnimationComplete = useCallback(() => {
        if (isJumping.current) return;

        const firstReal = VISIBLE;
        const lastReal = VISIBLE + real.length - 1;

        const jump = (to: number) => {
            isJumping.current = true;
            setAnimated(false);
            setActive(to);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimated(true);
                    isJumping.current = false;
                });
            });
        };

        if (active > lastReal) jump(firstReal + (active - lastReal - 1));
        if (active < firstReal) jump(lastReal - (firstReal - active - 1));
    }, [active, real.length]);

    const dotIndex = useMemo(() => {
        const idx = (active - VISIBLE) % real.length;
        return ((idx % real.length) + real.length) % real.length;
    }, [active, real.length]);

    return (
        <section ref={ref} className="py-16 md:py-24 bg-white">
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
                        Latest Articles
                    </h2>
                    <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
                        Stay updated with our latest stories and impact reports
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : real.length === 0 ? (
                    <div className="flex justify-center items-center h-80">
                        <p className="text-gray-500 font-light">No recent articles available.</p>
                    </div>
                ) : (
                    <>
                        {/* Sliding track */}
                        <div className="overflow-hidden" ref={ref}>
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
                                {track.map((blog, i) => {
                                    const imageUrl = blog.cover_image ?? "/Logos/Hovuca-cropped.png";
                                    const bucket = i < VISIBLE ? "tail" : i >= VISIBLE + real.length ? "head" : "real";
                                    const isFirst = bucket === "real" && i === VISIBLE;
                                    return (
                                        <motion.div
                                            key={`${bucket}-${blog.id}`}
                                            className="w-1/3 shrink-0 px-4"
                                            aria-hidden={bucket !== "real"}
                                            // Stagger only real cards when section comes into view
                                            initial={bucket === "real" ? { opacity: 0, y: 20 } : false}
                                            animate={
                                                bucket === "real" && isInView
                                                    ? { opacity: 1, y: 0 }
                                                    : bucket !== "real"
                                                        ? { opacity: 1, y: 0 }
                                                        : undefined
                                            }
                                            transition={{ duration: 0.5, delay: bucket === "real" ? (i - VISIBLE) * 0.1 : 0 }}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <Link
                                                href={`/blog/${blog.slug}`}
                                                tabIndex={bucket !== "real" ? -1 : undefined}
                                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full"
                                            >
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={blog.title}
                                                        fill
                                                        priority={isFirst && !!blog.cover_image}
                                                        loading={isFirst && !!blog.cover_image ? "eager" : "lazy"}
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="text-sm font-light text-gray-400 mb-2">
                                                        {new Date(blog.created_at).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                    <motion.h3
                                                        whileHover={{ x: 2 }}
                                                        className="text-xl font-light text-black mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2"
                                                    >
                                                        {blog.title}
                                                    </motion.h3>
                                                    <p className="text-gray-500 text-sm font-light leading-relaxed line-clamp-3">
                                                        {blog.excerpt}
                                                    </p>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                <button
                                    onClick={prev}
                                    className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </motion.div>

                            <div className="flex gap-2">
                                {real.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActive(VISIBLE + i)}
                                        aria-label={`Go to slide ${i + 1}`}
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                            i === dotIndex ? "bg-black" : "bg-gray-200"
                                        }`}
                                    />
                                ))}
                            </div>

                            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                <button
                                    onClick={next}
                                    className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        </div>
                    </>
                )}

                {/* CTA */}
                <div className="text-center mt-12">
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-900 to-blue-900 hover:from-[hsl(262,83%,58%)] hover:to-[hsl(217,91%,60%)] text-white font-light rounded-md shadow-lg hover:shadow-xl transition-all duration-500"
                        >
                            Read More Stories
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
