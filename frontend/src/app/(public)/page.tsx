"use client";

import Link from "next/link";
import React, { useState } from "react";
import { motion } from "framer-motion";
import BlogsCarousel from "@/components/home/BlogCarousel";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import Stats from "@/components/home/Stats";
import DonorCarousel from "@/components/home/DonorCarousel";

export default function HomePage() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.SubmitEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail("");
        }
    };

    return (
        <main className="w-full bg-white">

            {/* ── Hero ──────────────────────────────────────────────────────────── */}
            {/* Single viewport wrapper */}
            <div className="flex flex-col bg-purple-950" style={{ minHeight: "calc(100vh - 64px)" }}>

                {/* ── Hero ──────────────────────────────────────────────────────── */}
                <section className="relative flex-1 flex items-center justify-center overflow-hidden">

                    {/* Background image with dark overlay */}
                    <motion.div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                        style={{
                            backgroundImage:
                                "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80')",
                        }}
                        initial={{ scale: 1.12, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.22 }}
                        transition={{ duration: 3.2, ease: "easeOut" }}
                    />

                    {/* Radial vignette */}
                    <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

                    {/* Subtle warm accent line — top */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent z-20" />

                    {/* Content */}
                    <motion.div
                        className="relative z-20 w-full flex items-center"
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="mx-auto max-w-5xl px-6 text-center text-white">

                            {/* Eyebrow */}
                            <motion.p
                                className="mb-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/40"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <span className="block w-6 h-px bg-amber-300/50" />
                                {`Hovuca's Initiative`}
                                <span className="block w-6 h-px bg-amber-300/50" />
                            </motion.p>

                            {/* Main headline */}
                            <motion.h1
                                className="font-display font-extralight leading-[1.06] tracking-tight"
                                style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                Empowering young
                                <br />
                                <motion.span
                                    className="block italic text-amber-200 font-extralight"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55, duration: 0.9 }}
                                >
                                    changemakers
                                </motion.span>
                                <span className="text-white/50">Nationwide</span>
                            </motion.h1>

                            {/* Sub */}
                            <motion.p
                                className="mx-auto mt-10 max-w-lg text-base text-white/55 font-light leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65, duration: 0.7 }}
                            >
                                We support the next generation of leaders to transform bold ideas
                                into meaningful social impact across Cameroon.
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        <span className="text-[9px] tracking-[0.35em] text-white/30 uppercase">Scroll</span>
                        <motion.div
                            className="w-px h-9 bg-gradient-to-b from-white/30 to-transparent"
                            style={{ originY: 0 }}
                            animate={{ scaleY: [0, 1, 0] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                </section>

                {/* ── Donor Carousel ────────────────────────────────────────────── */}
                <DonorCarousel />

            </div>

            {/* ── Stats ─────────────────────────────────────────────────────────── */}
            <Stats />

            {/* ── Featured Projects ─────────────────────────────────────────────── */}
            <FeaturedProjects />

            {/* ── Blog Carousel ─────────────────────────────────────────────────── */}
            <BlogsCarousel />

            {/* ── Newsletter ────────────────────────────────────────────────────── */}
            <motion.section
                className="relative bg-neutral-50 py-24 lg:py-32 overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />

                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        {/* Eyebrow */}
                        <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                            Stay in the loop
                        </p>
                        <h2
                            className="font-display font-light text-black mb-5 tracking-tight"
                            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                        >
                            Stay updated
                        </h2>
                        <p className="text-base text-neutral-500 font-light leading-relaxed max-w-sm mx-auto">
                            Impact stories, program announcements, and opportunities — straight
                            to your inbox.
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubscribe}
                        className="flex max-w-md mx-auto gap-0"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        {subscribed ? (
                            <p className="flex-1 text-center text-emerald-700 font-light py-3 text-sm tracking-wide">
                                🎉 You&apos;re subscribed — thank you!
                            </p>
                        ) : (
                            <>
                                <input
                                    aria-label="Email address"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-4 py-3.5 border border-neutral-300 border-r-0 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 bg-white transition-colors font-light"
                                    placeholder="Your email address"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3.5 bg-slate-700 text-white text-sm font-light tracking-wide hover:bg-purple-700 transition-colors duration-200 whitespace-nowrap border border-neutral-900"
                                >
                                    Subscribe
                                </button>
                            </>
                        )}
                    </motion.form>

                    <p className="text-center mt-5 text-[11px] text-neutral-400 font-light tracking-wide">
                        No spam. Unsubscribe anytime.
                    </p>
                </div>
            </motion.section>

            {/* ── CTA ───────────────────────────────────────────────────────────── */}
            <motion.section
            className="relative bg-sidebar-foreground text-background py-36 overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                {/* Warm ambient glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(251,191,36,0.07),transparent)]" />
                {/* Top border */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />

                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">

                    <motion.p
                        className="mb-6 text-[10px] uppercase tracking-[0.35em] text-white/30"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        Join the movement
                    </motion.p>

                    <motion.h2
                        className="font-display font-extralight leading-[1.08] tracking-tight mb-8"
                        style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        Ready to make
                        <br />
                        <span className="italic text-amber-200/80">a difference?</span>
                    </motion.h2>

                    <motion.p
                        className="text-base text-white/40 font-light mb-14 max-w-xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        Join thousands of changemakers transforming their communities.
                        Start your journey today.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24, duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/register"
                            className="px-9 py-3.5 bg-amber-300 text-neutral-900 text-sm font-medium tracking-wide hover:bg-amber-200 transition-colors duration-200 rounded-sm min-w-[160px] text-center"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/donate"
                            className="px-9 py-3.5 border border-white/20 text-white/70 text-sm font-light tracking-wide hover:border-white/50 hover:text-white transition-colors duration-200 rounded-sm min-w-[160px] text-center"
                        >
                            Donate Now
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

        </main>
    );
}