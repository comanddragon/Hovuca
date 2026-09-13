"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { motion } from "framer-motion";
import DonorCarousel from "@/components/home/DonorCarousel";
import { useArticles, usePrograms, useResources } from "@/hooks";

const evidenceLinks = [
    { number: "01", label: "Programs", href: "/programs" },
    { number: "02", label: "Field stories", href: "/blog" },
    { number: "03", label: "Publications", href: "/documents" },
];

const fallbackPrograms = [
    {
        id: "child-protection",
        slug: "child-protection",
        title: "Child protection",
        excerpt: "Community-led systems that help children grow up safe, supported and heard.",
    },
    {
        id: "girls-empowerment",
        slug: "girls-empowerment",
        title: "Girls’ empowerment",
        excerpt: "Practical skills, confidence and opportunities shaped alongside girls and young women.",
    },
    {
        id: "health-wellbeing",
        slug: "health-wellbeing",
        title: "Health and wellbeing",
        excerpt: "Local action that strengthens the wellbeing of children, adolescents and families.",
    },
];

const fallbackStories = [
    {
        id: "community-leadership",
        slug: "community-leadership",
        title: "Young people leading change where they live",
        excerpt: "A closer look at the ideas, partnerships and practical action growing from local communities.",
        cover_image: "/heros/hero1.png",
        cover_image_alt: "Young people participating in a HOVUCA community activity",
        category: { name: "Field story" },
    },
    {
        id: "learning-together",
        slug: "learning-together",
        title: "Learning together, building opportunity",
        excerpt: "How practical learning creates room for confidence, connection and possibility.",
        cover_image: "/blogs/2.jpg",
        cover_image_alt: "HOVUCA participants learning together",
        category: { name: "From the field" },
    },
    {
        id: "stronger-communities",
        slug: "stronger-communities",
        title: "Partnerships that strengthen communities",
        excerpt: "Community voices and shared responsibility remain at the centre of lasting progress.",
        cover_image: "/assets/plates/program-photo.png",
        cover_image_alt: "A HOVUCA community partnership activity",
        category: { name: "Partnership" },
    },
];

function SectionKicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
    return (
        <p className={`flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.28em] ${light ? "text-white/75" : "text-[#46525b]"}`}>
            <span className="h-px w-12 bg-[#e0aa18]" aria-hidden="true" />
            {children}
        </p>
    );
}

export default function HomePage() {
    const { data: programData } = usePrograms({ page: 1, page_size: 3 });
    const { data: articleData } = useArticles({ page: 1, page_size: 3 });
    const { data: resources = [] } = useResources();
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const programs = (programData?.results?.length ? programData.results : fallbackPrograms).slice(0, 3);
    const articles = (articleData?.results?.length ? articleData.results : fallbackStories).slice(0, 3);

    return (
        <main className="w-full overflow-hidden bg-white text-[#183b35]">
            <div className="relative h-[1120px] w-full lg:aspect-[1502/1047] lg:h-auto lg:min-h-[820px] lg:max-h-[1047px]">
                <section className="absolute inset-x-0 top-0 h-[780px] overflow-hidden lg:h-[77.4%]" aria-labelledby="home-heading">
                    <Image
                        src="/assets/plates/hero-photo.png"
                        alt="Young people taking part in a community-led discussion in Cameroon"
                        fill
                        priority
                        loading="eager"
                        unoptimized
                        sizes="100vw"
                        className="object-cover object-[54%_center] lg:object-center"
                    />

                    <div className="absolute inset-x-5 bottom-0 bg-white px-6 py-7 text-[#183b35] sm:inset-x-auto sm:left-8 sm:w-[460px] lg:left-[clamp(1.5rem,2.6vw,2.5rem)] lg:w-[min(32.2vw,483px)] lg:min-w-[420px] lg:px-[clamp(1.75rem,2.15vw,2.15rem)] lg:py-[clamp(1.6rem,2.2vw,2.3rem)]">
                        <h1
                            id="home-heading"
                            className="max-w-[420px] text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-5xl lg:text-[clamp(3rem,3.45vw,3.35rem)]"
                            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                        >
                            Young people<br />are partners<br />in change.
                        </h1>
                        <span className="mt-7 block h-1 w-10 bg-[#e0aa18]" aria-hidden="true" />
                        <p className="mt-3 max-w-[390px] text-[0.95rem] leading-[1.42] text-[#535a63] lg:text-[clamp(0.95rem,1.2vw,1.08rem)]">
                            At HOVUCA, young people lead, collaborate and create solutions for stronger, more inclusive communities in Cameroon.
                        </p>
                        <Link
                            href="/projects"
                            className="mt-4 inline-flex h-12 w-[222px] items-center justify-between border border-white/35 bg-[#dc6248] px-3 text-[15px] font-normal text-white transition-colors hover:bg-[#bd4934] focus-visible:bg-[#bd4934]"
                        >
                            Explore our impact <ArrowRight className="h-7 w-7" strokeWidth={1.5} />
                        </Link>
                    </div>

                    <aside className="absolute right-0 top-[15.9%] hidden w-[130px] bg-white text-[#183b35] lg:block" aria-label="Explore HOVUCA evidence">
                        {evidenceLinks.map((item, index) => (
                            <Link
                                key={item.number}
                                href={item.href}
                                className="group relative flex h-[8.26vw] max-h-[124px] flex-col justify-center border-b border-[#e0aa18]/65 px-5 last:border-b-0"
                            >
                                {index === 0 && <span className="absolute inset-y-8 left-3 w-[3px] bg-[#e0aa18]" aria-hidden="true" />}
                                <span
                                    className={`text-[1.35rem] leading-none ${index === 0 ? "text-[#d99800]" : "text-[#2d3540]"}`}
                                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                                >
                                    {item.number}
                                </span>
                                <span className="mt-2 text-xs font-semibold text-[#183b35] transition-colors group-hover:text-[#d85c43]">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </aside>

                    <span className="absolute bottom-[18px] right-[315px] hidden h-px w-8 bg-[#e0aa18] md:block" aria-hidden="true" />
                    <p className="absolute bottom-1.5 right-[30px] hidden h-[19px] w-[285px] items-center border-b border-[#183b35]/25 bg-[#7c849b] px-1 text-[11px] font-normal text-white md:flex">
                        Centre Region, Cameroon · Community-led program
                    </p>
                </section>

                <section className="absolute inset-x-0 bottom-0 grid h-[340px] grid-rows-[185px_1fr] lg:h-[22.6%] lg:grid-cols-2 lg:grid-rows-1" aria-labelledby="program-story-heading">
                    <motion.div
                        className="relative overflow-hidden"
                        initial={{ filter: "saturate(0.82) contrast(0.96)", scale: 1.012 }}
                        whileInView={{ filter: "saturate(1) contrast(1)", scale: 1 }}
                        viewport={{ once: true, amount: 0.55 }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Image
                            src="/assets/plates/program-photo.png"
                            alt="A young woman learning a practical skill"
                            fill
                            unoptimized
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover"
                        />
                    </motion.div>
                    <div className="flex flex-col justify-center bg-white px-6 py-6 lg:translate-y-1 lg:px-[clamp(2.5rem,4.5vw,4.25rem)] lg:py-8">
                        <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#45505a]">
                            <span className="h-px w-12 bg-[#e0aa18]" aria-hidden="true" />
                            Our programs
                        </p>
                        <h2
                            id="program-story-heading"
                            className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.03em] text-[#183b35] lg:mt-4 lg:text-[clamp(2rem,2.65vw,2.6rem)]"
                            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                        >
                            Practical skills.<br />Real opportunities.
                        </h2>
                        <p className="mt-2 max-w-[610px] text-[13px] leading-5 text-[#59606a] lg:text-sm lg:leading-6">
                            From education and life skills to entrepreneurship and community leadership, we work with young people to turn potential into lasting change.
                        </p>
                        <Link href="/programs" className="mt-2 inline-flex w-fit items-center gap-3 text-xs font-semibold text-[#d85c43] hover:text-[#a93f2d]">
                            See our programs <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </div>
            <section className="bg-[#f2f0ea] px-6 py-24 lg:px-10 lg:py-32" aria-labelledby="programs-heading">
                <div className="mx-auto max-w-[1422px]">
                    <div className="grid gap-10 border-b border-[#183b35]/25 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <SectionKicker>Where we work</SectionKicker>
                        <div>
                            <h2 id="programs-heading" className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-[#183b35] md:text-7xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                                Programs shaped around real lives.
                            </h2>
                            <p className="mt-6 max-w-2xl text-base leading-7 text-[#566067]">
                                We work with children, girls, young people and local partners to turn knowledge into practical, community-led action.
                            </p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3">
                        {programs.map((program, index) => (
                            <Link
                                key={program.id}
                                href={`/programs/${program.slug}`}
                                className="group flex min-h-[360px] flex-col border-b border-[#183b35]/25 px-0 py-10 text-[#183b35] lg:border-b-0 lg:border-r lg:px-9 lg:last:border-r-0 lg:first:pl-0"
                            >
                                <span className="text-sm text-[#d85c43]">0{index + 1}</span>
                                <h3 className="mt-auto max-w-sm text-4xl font-semibold leading-[1.02] tracking-[-0.025em]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                                    {program.title}
                                </h3>
                                <p className="mt-5 max-w-sm text-sm leading-6 text-[#59636a]">{program.excerpt}</p>
                                <span className="mt-8 inline-flex items-center gap-3 text-xs font-semibold text-[#d85c43]">
                                    Discover the program <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-24 lg:px-10 lg:py-32" aria-labelledby="stories-heading">
                <div className="mx-auto max-w-[1422px]">
                    <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <SectionKicker>Field stories</SectionKicker>
                            <h2 id="stories-heading" className="mt-6 text-5xl font-semibold leading-none tracking-[-0.035em] text-[#183b35] md:text-7xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                                Voices from the work.
                            </h2>
                        </div>
                        <Link href="/blog" className="inline-flex items-center gap-3 text-sm font-semibold text-[#d85c43]">
                            Read all stories <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-14 grid gap-10 lg:grid-cols-3">
                        {articles.map((article) => (
                            <article key={article.id} className="group border-t border-[#e0aa18] pt-5">
                                <Link href={`/blog/${article.slug}`}>
                                    <div className="relative aspect-[4/3] overflow-hidden bg-[#e7e5de]">
                                        <Image
                                            src={article.cover_image || "/blogs/2.jpg"}
                                            alt={article.cover_image_alt || article.title}
                                            fill
                                            unoptimized
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                                        />
                                    </div>
                                    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d85c43]">{article.category?.name || "HOVUCA story"}</p>
                                    <h3 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.02em] text-[#183b35]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                                        {article.title}
                                    </h3>
                                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#5b646a]">{article.excerpt}</p>
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid bg-[#183b35] text-white lg:grid-cols-[0.78fr_1.22fr]" aria-labelledby="resources-heading">
                <div className="flex min-h-[540px] flex-col justify-between border-b border-white/20 px-6 py-16 lg:border-b-0 lg:border-r lg:px-10 lg:py-20">
                    <SectionKicker light>Knowledge for action</SectionKicker>
                    <div>
                        <h2 id="resources-heading" className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.035em] md:text-7xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                            Resources made to be used.
                        </h2>
                        <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
                            Explore policies, reports, advocacy materials and practical learning from our work in Cameroon.
                        </p>
                        <Link href="/documents" className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-[#f2c14e]">
                            Browse publications <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
                <div className="divide-y divide-white/20">
                    {(resources.length ? resources.slice(0, 3) : [
                        { id: "policy", title: "Child Protection Policy", category: "Policy" },
                        { id: "rights", title: "Promotion of the Rights of the Child in Cameroon", category: "Publication" },
                        { id: "advocacy", title: "Advocacy Brief", category: "Advocacy" },
                    ]).map((resource, index) => (
                        <Link key={resource.id} href="/documents" className="group grid min-h-[180px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-8 transition-colors hover:bg-white/5 lg:px-12">
                            <span className="text-sm text-[#f2c14e]">0{index + 1}</span>
                            <span>
                                <small className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{resource.category}</small>
                                <strong className="mt-3 block max-w-2xl text-2xl font-semibold leading-tight md:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{resource.title}</strong>
                            </span>
                            <span className="flex h-12 w-12 items-center justify-center border border-white/35 text-[#f2c14e] transition-transform group-hover:translate-x-1" aria-hidden="true"><FileText className="h-5 w-5" /></span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="border-y border-[#183b35]/15 bg-[#f7f5f0] py-14">
                <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#46525b]">Partners in the work</p>
                <DonorCarousel />
            </section>

            <section className="grid lg:grid-cols-2" aria-labelledby="involved-heading">
                <div className="bg-[#e0aa18] px-6 py-20 text-[#183b35] lg:px-10 lg:py-28">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em]">Get involved</p>
                    <h2 id="involved-heading" className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.035em] md:text-7xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Bring your skills to the work.
                    </h2>
                    <p className="mt-7 max-w-xl text-base leading-7 text-[#294842]">Volunteer alongside programs rooted in local knowledge and shared responsibility.</p>
                    <Link href="/volunteer" className="mt-9 inline-flex items-center gap-3 border border-[#183b35] px-6 py-4 text-sm font-semibold">Volunteer with us <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="bg-[#d85c43] px-6 py-20 text-white lg:px-10 lg:py-28">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">Work together</p>
                    <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.035em] md:text-7xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Build a lasting partnership.
                    </h2>
                    <p className="mt-7 max-w-xl text-base leading-7 text-white/80">Partner with HOVUCA to strengthen programs, knowledge and opportunity in Cameroon.</p>
                    <Link href="/contact" className="mt-9 inline-flex items-center gap-3 border border-white px-6 py-4 text-sm font-semibold">Start a conversation <ArrowRight className="h-4 w-4" /></Link>
                </div>
            </section>

            <section className="bg-white px-6 py-20 lg:px-10 lg:py-24">
                <div className="mx-auto grid max-w-[1422px] gap-10 border-t border-[#183b35] pt-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
                    <div>
                        <SectionKicker>Stay connected</SectionKicker>
                        <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#183b35] md:text-6xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                            Stories and opportunities, sent with purpose.
                        </h2>
                    </div>
                    {subscribed ? (
                        <p className="border-l-4 border-[#e0aa18] bg-[#f2f0ea] p-6 font-semibold text-[#183b35]">Thank you. You’re on the list.</p>
                    ) : (
                        <form
                            onSubmit={(event) => { event.preventDefault(); setSubscribed(true); setEmail(""); }}
                            className="flex flex-col border border-[#183b35] sm:flex-row"
                        >
                            <label htmlFor="home-email" className="sr-only">Email address</label>
                            <input
                                id="home-email"
                                suppressHydrationWarning
                                type="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Email address"
                                className="min-h-14 flex-1 bg-white px-5 text-[#183b35] outline-none placeholder:text-[#183b35]/45"
                            />
                            <button suppressHydrationWarning type="submit" className="min-h-14 bg-[#183b35] px-7 text-sm font-semibold text-white">Subscribe</button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}
