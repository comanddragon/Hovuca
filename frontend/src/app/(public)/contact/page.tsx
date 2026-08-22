"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
    Mail,
    Phone,
    MapPin,
    Send,
    Clock,
    ArrowRight,
    MessageSquare,
    Users,
    HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Data ─────────────────────────────────────────────────────────────────────

const contactMethods = [
    {
        icon: Mail,
        label: "Email us",
        value: "hovuca@contact.org",
        sub: "We reply within 24 hours",
        href: "mailto:hovuca@contact.org",
    },
    {
        icon: Phone,
        label: "Call us",
        value: "+237 (696) 23-0391",
        sub: "Mon – Fri, 8 am – 5 pm",
        href: "tel:+237696230391",
    },
    {
        icon: MapPin,
        label: "Visit us",
        value: "Yaoundé, Cameroon",
        sub: "Centre Region HQ",
        href: "https://maps.google.com/?q=Yaoundé,Cameroon",
    },
    {
        icon: Clock,
        label: "Office hours",
        value: "Mon – Fri, 8 am – 5 pm",
        sub: "Closed on public holidays",
        href: "#map",
    },
];

const reasons = [
    { icon: MessageSquare, title: "General Inquiry", desc: "Questions about our work, mission, or community." },
    { icon: HeartHandshake,  title: "Partnership",    desc: "Explore collaboration, funding, or co-programming." },
    { icon: Users,           title: "Volunteering",   desc: "Join our network of committed field volunteers." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroY   = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
    const heroOpa = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    // AOS observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) e.target.classList.add("is-visible");
                else e.target.classList.remove("is-visible");
            }),
            { threshold: 0.12 }
        );
        document
            .querySelectorAll(".aos-fade-up, .aos-fade-in, .aos-slide-left, .aos-slide-right, .aos-scale-in")
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Form state
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [activeReason, setActiveReason] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;
        setSending(true);
        await new Promise((r) => setTimeout(r, 1400));
        setSending(false);
        setSent(true);
    };

    return (
        <main className="min-h-screen bg-background">

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative flex min-h-[72vh] items-center justify-center overflow-hidden bg-neutral-950" style={{ position: "relative" }}>

                <motion.div className="absolute inset-0" style={{ y: heroY, opacity: 0.2 }}>
                    <Image
                        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80"
                        alt="Community"
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                </motion.div>

                {/* Layered overlays — same recipe as blog/about */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-transparent to-neutral-950/80" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <motion.div
                    className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
                    style={{ opacity: heroOpa }}
                >
                    <motion.p
                        className="mb-6 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/40"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className="block w-6 h-px bg-primary/60" />
                        Hovuca Initiative
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Get in
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Touch
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-md text-base text-white/50 font-light leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        {`Whether you want to partner, volunteer, or simply learn more — we'd love to hear from you.`}
                    </motion.p>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
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

            {/* ── CONTACT METHODS ───────────────────────────────────────────── */}
            <section className="py-24 bg-muted/40">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {contactMethods.map(({ icon: Icon, label, value, sub, href }, i) => {
                            const inner = (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08, duration: 0.5 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -4 }}
                                    className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-7 hover:shadow-md transition-all duration-300"
                                >
                                    <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center">
                                        <Icon className="h-4.5 w-4.5 text-background" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-light">
                                            {label}
                                        </p>
                                        <p className="text-sm font-medium text-foreground leading-snug">{value}</p>
                                        <p className="text-xs text-muted-foreground font-light mt-0.5">{sub}</p>
                                    </div>
                                    {href && (
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 mt-auto" />
                                    )}
                                </motion.div>
                            );
                            return href ? (
                                <a key={i} href={href}  {...(!href.startsWith("#") && { target: "_blank", rel: "noopener noreferrer" })} className="block">
                                    {inner}
                                </a>
                            ) : (
                                <div key={i}>{inner}</div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── FORM + SIDEBAR ────────────────────────────────────────────── */}
            <section className="py-32 bg-background">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-start">

                        {/* ── Form ── */}
                        <div>
                            <div className="aos-fade-in mb-3 text-muted-foreground text-[10px] font-light tracking-widest uppercase">
                                Send a message
                            </div>
                            <h2 className="aos-fade-up font-display font-light text-foreground tracking-tight mb-10"
                                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                                We read every message
                            </h2>

                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-border bg-muted/40 px-10 py-14 text-center"
                                >
                                    <div className="mx-auto mb-6 h-14 w-14 rounded-full bg-foreground flex items-center justify-center">
                                        <Send className="h-5 w-5 text-background" />
                                    </div>
                                    <h3 className="font-display font-light text-2xl text-foreground mb-3 tracking-tight">
                                        Message sent!
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto leading-relaxed">
                                        Thank you for reaching out. A member of our team will be in touch within one business day.
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-8 text-muted-foreground"
                                        onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                                    >
                                        Send another
                                    </Button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Reason pills */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {reasons.map(({ icon: Icon, title }, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setActiveReason(i)}
                                                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-light border transition-all duration-200 ${
                                                    activeReason === i
                                                        ? "bg-foreground text-background border-foreground"
                                                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Name + Email row */}
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
                                                Full name <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                name="name"
                                                required
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="Your full name"
                                                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors font-light"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
                                                Email <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="you@example.com"
                                                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors font-light"
                                            />
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
                                            Subject
                                        </label>
                                        <input
                                            name="subject"
                                            value={form.subject}
                                            onChange={handleChange}
                                            placeholder={`Re: ${reasons[activeReason].title}`}
                                            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors font-light"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
                                            Message <span className="text-destructive">*</span>
                                        </label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={6}
                                            value={form.message}
                                            onChange={handleChange}
                                            placeholder="Tell us what's on your mind…"
                                            className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors font-light"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <p className="text-xs text-muted-foreground font-light">
                                            We never share your information.
                                        </p>
                                        <Button
                                            type="submit"
                                            disabled={sending}
                                            className="rounded-full px-7 gap-2"
                                        >
                                            {sending ? (
                                                <>
                                                    <motion.div
                                                        className="h-3.5 w-3.5 rounded-full border-2 border-background/30 border-t-background"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    Sending…
                                                </>
                                            ) : (
                                                <>
                                                    Send message
                                                    <Send className="h-3.5 w-3.5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* ── Sidebar ── */}
                        <div className="space-y-6 lg:sticky lg:top-28">

                            {/* Reasons */}
                            <div className="rounded-2xl border border-border bg-card p-7">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light mb-5">
                                    Why reach out?
                                </p>
                                <div className="space-y-5">
                                    {reasons.map(({ icon: Icon, title, desc }, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 16 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            viewport={{ once: true }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-0.5 h-8 w-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                                                <Icon className="h-3.5 w-3.5 text-background" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-light text-foreground leading-none mb-1">{title}</p>
                                                <p className="text-xs text-muted-foreground font-light leading-relaxed">{desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Social / Quick links */}
                            <div className="rounded-2xl border border-border bg-muted/40 p-7">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light mb-5">
                                    Quick links
                                </p>
                                <div className="space-y-2">
                                    {[
                                        { label: "About HOVUCA",    href: "/about" },
                                        { label: "Our Projects",    href: "/projects" },
                                        { label: "Volunteer",       href: "/volunteers" },
                                        { label: "Donate",          href: "/donate" },
                                    ].map(({ label, href }) => (
                                        <Link
                                            key={href}
                                            href={href}
                                            className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-light text-muted-foreground hover:bg-card hover:text-foreground hover:border-border border border-transparent transition-all duration-200 group"
                                        >
                                            {label}
                                            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAP STRIP ─────────────────────────────────────────────────── */}
            <section id="map" className="h-[720px] relative overflow-hidden bg-muted">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127580.87349843!2d11.4611!3d3.8480!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf703a599ef3%3A0xa77e6c1ce2e17c57!2sYaound%C3%A9%2C%20Cameroon!5e0!3m2!1sen!2s!4v1680000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "grayscale(1) contrast(1.1) opacity(0.85)" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="HOVUCA location — Yaoundé, Cameroon"
                />
                {/* Overlay fade edges */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
                </div>
                {/* Pin card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background/90 backdrop-blur-md px-6 py-4 flex items-center gap-4 shadow-lg"
                >
                    <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-background" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground leading-none mb-0.5">HOVUCA Headquarters</p>
                        <p className="text-xs text-muted-foreground font-light">Yaoundé, Centre Region, Cameroon</p>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}