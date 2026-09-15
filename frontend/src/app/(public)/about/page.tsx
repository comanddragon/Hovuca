"use client";

import Image from "next/image";
import { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
    CheckCircle2,
    HeartHandshake,
    ShieldCheck,
    Users,
    Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

/* ─── data ────────────────────────────────────────────────────── */
const stats = [
    { value: "15+", label: "Years of Service" },
    { value: "5K+", label: "Children Supported" },
    { value: "12", label: "Active Programs" },
    { value: "98%", label: "Community Impact" },
];

const principles = [
    {
        icon: Users,
        title: "Best Interest of the Child",
        text: "In all actions concerning children, the best interests of the child shall be a primary consideration.",
    },
    {
        icon: ShieldCheck,
        title: "Do No Harm",
        text: "In all our activities, decisions made concerning children, their families, and the community we will seek to avoid causing harm.",
    },
    {
        icon: HeartHandshake,
        title: "Gender Equality",
        text: "Though we may have specific projects for girls because of their high vulnerability, most of our projects involve both boys and girls.",
    },
    {
        icon: Globe2,
        title: "Integrity",
        text: "HOVUCA endeavors to be transparent, accountable, and responsible in all its activities with youth groups, community heads, staff, volunteers and partners.",
    },
    {
        icon: ShieldCheck,
        title: "Transparency",
        text: "Honestly tell our success story and failures regardless of consequence.",
    },
    {
        icon: HeartHandshake,
        title: "Non Discrimination",
        text: "At HOVUCA, all children and young people regardless of class, race, creed, religion, sex, disability, ethnic origin or sexual orientation have a right to protection.",
    },
    {
        icon: Globe2,
        title: "Participation & Sustainability",
        text: "We believe that children's participation in the initiation, design and implementation of projects that concern them will give them ownership and hence sustainability.",
    },
    {
        icon: HeartHandshake,
        title: "Partnership",
        text: "HOVUCA holds that success comes with developing partnerships with related organizations and government entities.",
    },
    {
        icon: Globe2,
        title: "Accountability",
        text: "Our structure and system of management is credible and linked directly to our ability to take responsibility for our actions.",
    },
];

const objectives = [
    "Increase access to children's basic and developmental rights.",
    "Improve the health of HIV/AIDS infected children and other vulnerable children.",
    "Care and support street, neglected, and abandoned children with basic non-food and food items and shelter.",
    "Increase awareness among children and community members on the rights of the child.",
    "Empower women to care and support vulnerable children with emotional and physical needs.",
    "Network and share information with development actors locally, nationally and internationally.",
    "Advocate for the rights of children and empower girls and adolescent girls to uphold their rights.",
];

/* ─── page ────────────────────────────────────────────────────── */
export default function AboutPage() {
    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    // CSS-driven scroll animations via IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                    } else {
                        entry.target.classList.remove("is-visible");
                    }
                });
            },
            { threshold: 0.15 }
        );
        document
            .querySelectorAll(".aos-fade-up, .aos-fade-in, .aos-slide-left, .aos-slide-right, .aos-scale-in")
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <main className="min-h-screen bg-background">

            {/* ── HERO ──────────────────────────────────────────── */}
            <section className="relative py-24 lg:py-34 overflow-hidden">

                <motion.div className="absolute inset-0" style={{ y: heroY }}>
                    <Image
                        src="/heros/hero1.webp"
                        alt="Hero background"
                        fill
                        priority
                        loading="eager"
                        sizes="100vw"
                        className="object-cover"
                    />
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-teal-900/60 to-black/80" />

                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-teal-600/20 to-cyan-700/30"
                    animate={{
                        background: [
                            "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(20, 184, 166, 0.2) 50%, rgba(14, 165, 233, 0.3) 100%)",
                            "linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(16, 185, 129, 0.25) 50%, rgba(20, 184, 166, 0.2) 100%)",
                            "linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(14, 165, 233, 0.3) 50%, rgba(16, 185, 129, 0.25) 100%)",
                        ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />

                <div className="relative max-w-6xl mx-auto px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            className="mb-8 text-white/80 text-sm font-light tracking-widest uppercase"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            About HOVUCA
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-display font-light text-white mb-12 leading-[0.9] tracking-tight">
                            Who <span className="font-extralight text-white/90">We Are</span>
                        </h1>

                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-16 font-light leading-relaxed">
                            We champion young people as changemakers — equipping them with resources,
                            community, and mentorship to lead with courage and compassion.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="#mission">
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button size="lg" className="bg-background hover:bg-muted text-foreground font-light px-8">
                                        Our Mission
                                    </Button>
                                </motion.div>
                            </Link>
                            <Link href="#principles">
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="text-luxury-navy hover:text-white border-white/30 hover:bg-white/10 backdrop-blur-sm font-light px-8"
                                    >
                                        Our Principles
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────────────── */}
            <section className="py-20 bg-background">
                <div className="max-w-6xl mx-auto px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: false }}
                                className="text-center"
                                whileHover={{ y: -4 }}
                            >
                                <div className="aos-fade-up text-4xl md:text-5xl font-light text-foreground mb-3" style={{ animationDelay: `${index * 100}ms` }}>
                                    {stat.value}
                                </div>
                                <div className="aos-fade-in text-muted-foreground font-light text-sm tracking-wide uppercase" style={{ animationDelay: `${index * 100 + 150}ms` }}>
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MISSION ───────────────────────────────────────── */}
            <section id="mission" className="py-32 bg-muted/40">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: false }}
                        >
                            <div className="aos-fade-in mb-6 text-muted-foreground text-sm font-light tracking-widest uppercase">
                                What drives us
                            </div>
                            <h2 className="aos-fade-up text-4xl md:text-5xl font-display font-light text-foreground mb-8 tracking-tight">
                                Our Mission
                            </h2>
                            <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                                <p>
                                    Our mission is to use research, education, advocacy and community
                                    partnerships to enhance child protection systems and facilitate
                                    vulnerable children&apos;s access to basic facilities.
                                </p>
                                <p>
                                    We are committed to{" "}
                                    <span className="font-medium text-foreground">
                                        breaking barriers for the girl child
                                    </span>{" "}
                                    — enabling them to have equal rights, equal opportunities, and equal
                                    standing in every community we serve.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: false }}
                            className="relative"
                        >
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/heros/hero1.webp')] bg-cover bg-center" />
                                <div className="absolute inset-0 bg-black/10" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── VISION ────────────────────────────────────────── */}
            <section className="py-32 bg-background">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: false }}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/heros/hero1.webp')] bg-cover bg-center" />
                                <div className="absolute inset-0 bg-black/10" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: false }}
                            className="order-1 lg:order-2"
                        >
                            <div className="aos-fade-in mb-6 text-muted-foreground text-sm font-light tracking-widest uppercase">
                                Where we&apos;re going
                            </div>
                            <h2 className="aos-fade-up text-4xl md:text-5xl font-display font-light text-foreground mb-8 tracking-tight">
                                Our Vision
                            </h2>
                            <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                                <p>
                                    Our vision is to create an environment where children — especially
                                    girls and those in rural communities — have the right to protection,
                                    survival, development, and a voice.
                                </p>
                                <p>
                                    We imagine a world where every child grows up with dignity, safety,
                                    and the tools they need to become the changemakers of tomorrow.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── PRINCIPLES ────────────────────────────────────── */}
            <section id="principles" className="py-32 bg-muted/40">
                <div className="max-w-7xl mx-auto px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        className="text-center mb-20"
                    >
                        <div className="aos-fade-in mb-8 text-muted-foreground text-sm font-light tracking-widest uppercase">
                            How we operate
                        </div>
                        <h2 className="aos-fade-up text-5xl md:text-6xl font-display font-light text-foreground mb-8 tracking-tight">
                            Our Principles
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
                            These guidelines help us protect the wellbeing, dignity, and agency of everyone in our community.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {principles.map(({ icon: Icon, title, text }, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.07 }}
                                viewport={{ once: false }}
                                whileHover={{ y: -4 }}
                            >
                                <Card className="h-full border-0 bg-card hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="aos-scale-in h-9 w-9 bg-foreground rounded-full flex items-center justify-center mb-4">
                                            <Icon className="h-4 w-4 text-background" />
                                        </div>
                                        <h3 className="text-base font-light text-card-foreground mb-3">{title}</h3>
                                        <p className="text-muted-foreground font-light text-sm leading-relaxed">{text}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── OBJECTIVES ────────────────────────────────────── */}
            <section className="py-32 bg-background">
                <div className="max-w-7xl mx-auto px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        className="text-center mb-20"
                    >
                        <div className="aos-fade-in mb-8 text-muted-foreground text-sm font-light tracking-widest uppercase">
                            Our focus areas
                        </div>
                        <h2 className="aos-fade-up text-5xl md:text-6xl font-display font-light text-foreground mb-8 tracking-tight">
                            Our Objectives
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
                            Concrete goals that guide our programs, partnerships, and impact on the ground.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {objectives.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.07 }}
                                viewport={{ once: false }}
                                whileHover={{ x: 4 }}
                                className="flex items-start gap-4 p-5 rounded-lg bg-muted/40 hover:bg-card hover:shadow-md transition-all duration-300 border border-transparent hover:border-border"
                            >
                                <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                                </div>
                                <span className="text-sm font-light leading-relaxed text-muted-foreground">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────── */}
            <section className="py-32 bg-background">
                <div className="max-w-4xl mx-auto px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                    >
                        <h2 className="aos-fade-up text-5xl md:text-6xl font-display font-light text-foreground mb-12 tracking-tight">
                            Help us protect every child
                        </h2>

                        <p className="text-lg text-muted-foreground mb-16 max-w-xl mx-auto font-light leading-relaxed">
                            Join our community of partners, volunteers, and advocates working
                            to create a safer, fairer world for children everywhere.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contact">
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button size="lg" className="bg-foreground hover:bg-foreground/80 text-background font-light px-8">
                                        Get involved
                                    </Button>
                                </motion.div>
                            </Link>
                            <Link href="/programs">
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground font-light px-8">
                                        Our programs
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}
