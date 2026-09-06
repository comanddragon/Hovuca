"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    FileText,
    HandHeart,
    Heart,
    Sparkles,
    Users,
} from "lucide-react";
import DonorCarousel from "@/components/home/DonorCarousel";
import { useArticles, usePrograms, useResources } from "@/hooks";

const palette = {
    purple: "#35145f",
    coral: "#ff6868",
    yellow: "#ffd84d",
    blue: "#88d9ed",
    mint: "#dff4ee",
    cream: "#fff8eb",
};

const actions = [
    {
        title: "Support a child",
        description: "Help provide education, protection, health support, and practical care to a child who needs it.",
        href: "/donate",
        icon: Heart,
        color: palette.coral,
    },
    {
        title: "Volunteer with us",
        description: "Share your time and skills with programs led alongside children, girls, and local communities.",
        href: "/volunteer",
        icon: Users,
        color: palette.yellow,
    },
    {
        title: "Explore resources",
        description: "Read our policies, advocacy briefs, reports, and practical learning materials.",
        href: "/documents",
        icon: FileText,
        color: palette.blue,
    },
    {
        title: "Read our stories",
        description: "Meet the people, ideas, and community actions shaping a safer future for young people.",
        href: "/blog",
        icon: BookOpen,
        color: "#cbb8ff",
    },
];

const storyImages = ["/blogs/2.jpg", "/blogs/1.jpeg", "/blogs/4.jpeg"];

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-[#35145f]">
            {children}<span className="h-0.5 w-12 bg-[#ff6868]" />
        </p>
    );
}

export default function HomePage() {
    const { data: programData } = usePrograms({ page: 1, page_size: 3 });
    const { data: articleData } = useArticles({ page: 1, page_size: 3 });
    const { data: resources = [] } = useResources();
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const programs = programData?.results ?? [];
    const articles = articleData?.results ?? [];

    return (
        <main className="overflow-hidden bg-white text-[#241536]">
            <section className="relative bg-[#35145f] text-white">
                <div className="absolute left-0 top-0 h-3 w-1/3 bg-[#ff6868]" />
                <div className="absolute right-0 top-0 h-3 w-1/3 bg-[#88d9ed]" />
                <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
                        <p className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ffd84d]">
                            <Sparkles className="h-4 w-4" /> Hope starts here
                        </p>
                        <h1 className="max-w-2xl font-display text-[clamp(3.4rem,7vw,6.9rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
                            Every child can shape a brighter future.
                        </h1>
                        <p className="mt-8 max-w-xl text-lg leading-8 text-white/78">
                            HOVUCA works with vulnerable children, girls, and communities across Cameroon to strengthen protection, education, health, and opportunity.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link href="/donate" className="inline-flex items-center gap-2 bg-[#ff6868] px-7 py-4 text-sm font-bold text-white transition-transform hover:-translate-y-1">
                                Support our work <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href="/about" className="inline-flex items-center gap-2 border-2 border-white px-7 py-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#35145f]">
                                Meet HOVUCA
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div className="relative mx-auto w-full max-w-2xl pb-12 pl-6 pt-8" initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.7 }}>
                        <div className="absolute right-0 top-0 h-28 w-28 bg-[#ffd84d]" />
                        <div className="absolute bottom-0 left-0 h-40 w-40 bg-[#88d9ed]" />
                        <div className="relative aspect-[4/3] overflow-hidden border-[10px] border-white">
                            <Image src="/heros/hero1.png" alt="HOVUCA peer educators celebrating after a training" fill priority sizes="(max-width: 1024px) 90vw, 50vw" className="object-cover" />
                        </div>
                        <div className="absolute -bottom-1 right-4 max-w-[220px] bg-[#ff6868] p-5 text-sm font-bold leading-6 text-white shadow-xl">
                            Young people are not just beneficiaries. They are partners in change.
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="bg-[#dff4ee] py-20 md:py-28">
                <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
                    <div>
                        <SectionLabel>Why we exist</SectionLabel>
                        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-[#35145f] md:text-6xl">
                            We create room for children to be safe, heard, and supported.
                        </h2>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-[#4d3d5f]">
                            Through research, education, advocacy, and community partnerships, we help remove the barriers that keep vulnerable children—especially girls—from reaching their potential.
                        </p>
                        <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-bold text-[#35145f] underline decoration-[#ff6868] decoration-4 underline-offset-8">
                            Learn about our mission <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 self-end">
                        {[
                            ["25+", "projects launched", palette.yellow],
                            ["12", "active projects", palette.coral],
                            ["50K+", "lives reached", palette.blue],
                            ["1", "shared vision", "#cbb8ff"],
                        ].map(([value, label, color]) => (
                            <div key={label} className="flex min-h-44 flex-col justify-end p-6" style={{ backgroundColor: color }}>
                                <strong className="font-display text-4xl font-semibold text-[#35145f] md:text-5xl">{value}</strong>
                                <span className="mt-2 text-sm font-bold uppercase tracking-wide text-[#35145f]">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <SectionLabel>Get involved</SectionLabel>
                        <h2 className="font-display text-4xl font-semibold tracking-tight text-[#35145f] md:text-6xl">Choose how you want to make a difference.</h2>
                    </div>
                    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {actions.map(({ title, description, href, icon: Icon, color }, index) => (
                            <motion.article key={title} whileHover={{ y: -8 }} className="group flex min-h-[360px] flex-col p-7" style={{ backgroundColor: color }}>
                                <div className="flex items-start justify-between">
                                    <Icon className="h-9 w-9 text-[#35145f]" />
                                    <span className="font-display text-5xl font-semibold text-[#35145f]/20">0{index + 1}</span>
                                </div>
                                <div className="mt-auto">
                                    <h3 className="font-display text-3xl font-semibold leading-tight text-[#35145f]">{title}</h3>
                                    <p className="mt-4 text-sm leading-6 text-[#35145f]/80">{description}</p>
                                    <Link href={href} className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#35145f] text-white transition-transform group-hover:translate-x-2" aria-label={title}>
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#fff8eb] py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <SectionLabel>What we do</SectionLabel>
                            <h2 className="font-display text-4xl font-semibold tracking-tight text-[#35145f] md:text-6xl">Programs built around real lives.</h2>
                        </div>
                        <Link href="/programs" className="inline-flex items-center gap-2 font-bold text-[#35145f]">View all programs <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {(programs.length ? programs : [
                            { id: "1", slug: "child-protection", title: "Child protection", excerpt: "Stronger community systems that protect children from violence, neglect, and exploitation." },
                            { id: "2", slug: "girls-empowerment", title: "Girls' empowerment", excerpt: "Knowledge, confidence, and opportunities that help girls exercise their rights." },
                            { id: "3", slug: "health-nutrition", title: "Health and wellbeing", excerpt: "Practical support and advocacy for healthier children, adolescents, and families." },
                        ]).slice(0, 3).map((program, index) => (
                            <Link key={program.id} href={`/programs/${program.slug}`} className="group relative min-h-[330px] overflow-hidden bg-[#35145f] p-8 text-white">
                                <div className="absolute right-0 top-0 h-24 w-24" style={{ backgroundColor: [palette.coral, palette.yellow, palette.blue][index] }} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Program 0{index + 1}</span>
                                <div className="absolute inset-x-8 bottom-8">
                                    <h3 className="font-display text-4xl font-semibold leading-tight">{program.title}</h3>
                                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">{program.excerpt}</p>
                                    <span className="mt-6 inline-flex items-center gap-2 font-bold text-[#ffd84d]">Discover the program <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" /></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative bg-[#35145f] py-20 text-white md:py-28">
                <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[#ff6868] lg:block" />
                <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#88d9ed]">Knowledge for action</p>
                        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">Resources you can use and share.</h2>
                        <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Policies, reports, advocacy materials, and presentations from our work in Cameroon.</p>
                        <Link href="/documents" className="mt-8 inline-flex items-center gap-2 bg-[#ffd84d] px-6 py-3.5 text-sm font-bold text-[#35145f]">Browse all documents <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="grid gap-4 self-center">
                        {(resources.length ? resources.slice(0, 3) : [
                            { id: "1", title: "Child Protection Policy", category: "Policy", slug: "child-protection-policy" },
                            { id: "2", title: "Promotion of the Rights of the Child in Cameroon", category: "Publication", slug: "rights-of-the-child" },
                            { id: "3", title: "Advocacy Brief", category: "Advocacy", slug: "advocacy-brief" },
                        ]).map((resource, index) => (
                            <Link href="/documents" key={resource.id} className="group flex items-center gap-5 bg-white p-5 text-[#35145f] shadow-lg">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center" style={{ backgroundColor: [palette.blue, palette.yellow, "#cbb8ff"][index] }}><FileText className="h-6 w-6" /></span>
                                <span className="min-w-0 flex-1"><small className="font-bold uppercase tracking-wide text-[#ff6868]">{resource.category}</small><strong className="mt-1 block font-display text-xl leading-tight">{resource.title}</strong></span>
                                <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-2" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <SectionLabel>Latest voices</SectionLabel>
                            <h2 className="font-display text-4xl font-semibold tracking-tight text-[#35145f] md:text-6xl">Stories from our community.</h2>
                        </div>
                        <Link href="/blog" className="inline-flex items-center gap-2 font-bold text-[#35145f]">Read all stories <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="mt-12 grid gap-8 lg:grid-cols-3">
                        {articles.slice(0, 3).map((article, index) => (
                            <article key={article.id} className="group">
                                <Link href={`/blog/${article.slug}`} className="block">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-[#dff4ee]">
                                        <Image src={article.cover_image || storyImages[index]} alt={article.cover_image_alt || article.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                        <span className="absolute left-0 top-0 bg-[#ffd84d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#35145f]">{article.category?.name || "HOVUCA story"}</span>
                                    </div>
                                    <h3 className="mt-6 font-display text-3xl font-semibold leading-tight text-[#35145f] group-hover:text-[#ff6868]">{article.title}</h3>
                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5e5269]">{article.excerpt}</p>
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-[#35145f]/10 bg-[#eef8fb] py-12">
                <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.22em] text-[#35145f]">Partners in the work</p>
                <DonorCarousel />
            </section>

            <section className="bg-[#ffd84d] py-20 md:py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#35145f]">Stay connected</p>
                        <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-[#35145f] md:text-6xl">Get hopeful stories and opportunities in your inbox.</h2>
                    </div>
                    {subscribed ? (
                        <div className="bg-white p-7 text-lg font-bold text-[#35145f]">Thank you. You&apos;re on the list!</div>
                    ) : (
                        <form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); setEmail(""); }} className="flex flex-col gap-3 sm:flex-row">
                            <label htmlFor="home-email" className="sr-only">Email address</label>
                            <input id="home-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="min-h-14 flex-1 border-2 border-[#35145f] bg-white px-5 text-[#35145f] outline-none placeholder:text-[#35145f]/45" />
                            <button type="submit" className="min-h-14 bg-[#35145f] px-7 font-bold text-white">Subscribe</button>
                        </form>
                    )}
                </div>
            </section>

            <section className="bg-[#ff6868] py-20 text-white md:py-28">
                <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
                    <HandHeart className="h-12 w-12" />
                    <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">Together, we can protect possibility.</h2>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">Your support helps children and young people learn, speak up, stay safe, and build the future they imagine.</p>
                    <Link href="/donate" className="mt-9 inline-flex items-center gap-2 bg-[#35145f] px-8 py-4 font-bold text-white">Donate to HOVUCA <ArrowRight className="h-4 w-4" /></Link>
                </div>
            </section>
        </main>
    );
}
