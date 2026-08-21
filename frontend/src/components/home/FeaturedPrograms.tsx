import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { usePrograms } from "@/hooks";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturedPrograms() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const [active, setActive] = useState(0);
    const { data, isLoading } = usePrograms({});

    const programs = data?.results ?? [];
    const visible = programs.slice(0, 6);

    const prev = () => setActive((a) => (a - 1 + visible.length) % visible.length);
    const next = () => setActive((a) => (a + 1) % visible.length);

    const getVisiblePrograms = () => {
        if (visible.length === 0) return [];
        const count = Math.min(3, visible.length);
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(visible[(active + i) % visible.length]);
        }
        return result;
    };

    if (data && programs.length === 0) {
        return (
            <div className="flex justify-center items-center h-80">
                <p className="text-gray-500 font-light">No Programs available.</p>
            </div>
        );
    }

    return (
        <section ref={ref} className="py-16 md:py-24 bg-gray-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

                {/* Section header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-[clamp(1.75rem,5vw,3.5rem)] font-display font-light text-black mb-8 tracking-tight">
                        Featured Programs
                    </h2>
                    <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
                        Discover how your support creates lasting change in communities worldwide
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <div className="inline-block w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div key="content">
                            {/* Cards grid */}
                            <motion.div
                                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                                variants={containerVariants}
                                initial="hidden"
                                animate={isInView ? "visible" : "hidden"}
                            >
                                {getVisiblePrograms().map((program, i) => {
                                    const imageUrl = program.banner ?? "/Logos/Hovuca-cropped.png";
                                    return (
                                        <motion.div
                                            key={`program-${program.slug}-${i}`}
                                            variants={itemVariants}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <Link
                                                href={`/programs/${program.slug}`}
                                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group flex flex-col h-full"
                                            >
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={program.title}
                                                        fill
                                                        priority
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    {/* Status badge — frosted */}
                                                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-light text-black capitalize">
                                                            {program.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <motion.h3
                                                        whileHover={{ x: 2 }}
                                                        className="text-xl font-light text-black mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2"
                                                    >
                                                        {program.title}
                                                    </motion.h3>
                                                    <p className="text-gray-500 text-sm font-light mb-4 leading-relaxed line-clamp-2 flex-1">
                                                        {program.excerpt}
                                                    </p>
                                                    <span className="inline-flex items-center gap-1 text-sm font-light text-black group-hover:gap-2 transition-all">
                                                        Learn more <ArrowRight className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* Carousel controls */}
                            {visible.length > 3 && (
                                <div className="flex justify-center items-center gap-4 mt-10">
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <button
                                            onClick={prev}
                                            className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                            aria-label="Previous"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                    <div className="flex gap-2">
                                        {visible.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActive(i)}
                                                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                                    i === active ? "bg-black" : "bg-gray-200"
                                                }`}
                                                aria-label={`Go to slide ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <button
                                            onClick={next}
                                            className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                            aria-label="Next"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CTA */}
                <div className="text-center mt-12">
                    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
                        <Link
                            href="/programs"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-900 to-blue-900 hover:from-[hsl(262,83%,58%)] hover:to-[hsl(217,91%,60%)] text-white font-light rounded-md shadow-lg hover:shadow-xl transition-all duration-500"
                        >
                            View All Programs
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}