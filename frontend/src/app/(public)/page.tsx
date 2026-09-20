"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText } from "lucide-react";
import DonorCarousel from "@/components/home/DonorCarousel";
import HomeProjects from "@/components/home/HomeProjects";
import { SocialLinks } from "@/components/layout/SocialLinks";
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
        cover_image: "/heros/hero1.webp",
        cover_image_alt: "Young people participating in a HOVUCA community activity",
        category: { name: "Field story" },
    },
    {
        id: "learning-together",
        slug: "learning-together",
        title: "Learning together, building opportunity",
        excerpt: "How practical learning creates room for confidence, connection and possibility.",
        cover_image: "/assets/plates/program-photo.webp",
        cover_image_alt: "HOVUCA participants learning together",
        category: { name: "From the field" },
    },
    {
        id: "stronger-communities",
        slug: "stronger-communities",
        title: "Partnerships that strengthen communities",
        excerpt: "Community voices and shared responsibility remain at the centre of lasting progress.",
        cover_image: "/assets/plates/program-photo.webp",
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

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

        const targets = document.querySelectorAll<HTMLElement>("[data-home-reveal]");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.remove("home-reveal-pending");
                observer.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

        targets.forEach((target) => {
            if (target.getBoundingClientRect().top > window.innerHeight * 0.9) {
                target.classList.add("home-reveal-pending");
                observer.observe(target);
            }
        });

        return () => {
            observer.disconnect();
            targets.forEach((target) => target.classList.remove("home-reveal-pending"));
        };
    }, []);

    const programs = (programData?.results?.length ? programData.results : fallbackPrograms).slice(0, 3);
    const articles = (articleData?.results?.length ? articleData.results : fallbackStories).slice(0, 3);

    return (
        <main className="w-full overflow-hidden bg-white text-[#183b35]">
            <div className="grid h-[100svh] min-h-[640px] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto]">
                <section className="relative min-h-0 min-w-0 overflow-hidden" aria-labelledby="home-heading">
                    <Image
                        src="/assets/plates/hero-photo.webp"
                        alt="Young people taking part in a community-led discussion in Cameroon"
                        fill
                        priority
                        loading="eager"
                        unoptimized
                        sizes="100vw"
                        className="home-hero-photo object-cover object-[54%_center] lg:object-center"
                    />

                    <div className="home-hero-panel absolute inset-x-5 bottom-0 rounded-t-xl bg-white px-6 py-6 text-[#183b35] sm:inset-x-auto sm:left-8 sm:w-[440px] lg:left-[clamp(1.5rem,2.6vw,2.5rem)] lg:w-[min(32vw,460px)] lg:min-w-[390px] lg:px-8 lg:py-7">
                        <h1
                            id="home-heading"
                            className="max-w-[400px] text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[2.75rem] lg:text-[clamp(2.55rem,3vw,3rem)]"
                        >
                            Young people<br />are partners<br />in change.
                        </h1>
                        <span className="home-hero-rule mt-5 block h-1 w-10 origin-left bg-[#e0aa18]" aria-hidden="true" />
                        <p className="mt-3 max-w-[390px] text-[0.95rem] leading-[1.42] text-[#535a63] lg:text-[clamp(0.95rem,1.2vw,1.08rem)]">
                            At HOVUCA, young people lead, collaborate and create solutions for stronger, more inclusive communities in Cameroon.
                        </p>
                        <Link
                            href="/projects"
                            className="group mt-5 inline-flex h-11 w-[210px] items-center justify-between rounded-full bg-[#d85c43] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#b84733] focus-visible:bg-[#b84733]"
                        >
                            Explore our impact <ArrowRight className="h-7 w-7 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" strokeWidth={1.5} />
                        </Link>
                    </div>

                    <aside className="absolute right-0 top-[15.9%] hidden w-[124px] overflow-hidden rounded-l-xl bg-white text-[#183b35] lg:block" aria-label="Explore HOVUCA evidence">
                        {evidenceLinks.map((item, index) => (
                            <Link
                                key={item.number}
                                href={item.href}
                                className="group relative flex h-[8.26vw] max-h-[124px] flex-col justify-center border-b border-[#e0aa18]/65 px-5 last:border-b-0"
                            >
                                {index === 0 && <span className="absolute inset-y-8 left-3 w-[3px] bg-[#e0aa18]" aria-hidden="true" />}
                                <span
                                    className={`text-[1.35rem] leading-none ${index === 0 ? "text-[#d99800]" : "text-[#2d3540]"}`}
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

                <section className="min-w-0 overflow-hidden border-y border-[#183b35]/15 bg-white py-6">
                    <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#46525b]">Partners in the work</p>
                    <DonorCarousel />
                </section>
            </div>

            <section className="bg-white px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="programs-heading">
                <div className="mx-auto max-w-[1280px]">
                    <div data-home-reveal="rise" className="grid gap-10 border-b border-[#183b35]/25 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <SectionKicker>Where we work</SectionKicker>
                        <div>
                            <h2 id="programs-heading" className="max-w-3xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-[#183b35] md:text-6xl">
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
                                className="group flex min-h-[300px] flex-col border-b border-[#183b35]/25 px-0 py-9 text-[#183b35] lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0 lg:first:pl-0"
                            >
                                <span className="text-sm text-[#d85c43]">0{index + 1}</span>
                                <h3 className="mt-auto max-w-sm text-3xl font-bold leading-[1.07] tracking-[-0.025em]">
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

            <HomeProjects />

            <section className="px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="stories-heading">
                <div className="mx-auto max-w-[1280px]">
                    <div data-home-reveal="rise" className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <SectionKicker>Field stories</SectionKicker>
                            <h2 id="stories-heading" className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-[#183b35] md:text-6xl">
                                Voices from the work.
                            </h2>
                        </div>
                        <Link href="/blog" className="inline-flex items-center gap-3 text-sm font-semibold text-[#d85c43]">
                            Read all stories <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
                        {articles[0] && (
                            <article data-home-reveal="story-feature" className="home-story-feature group min-w-0">
                                <Link href={`/blog/${articles[0].slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d85c43]">
                                    <div className="home-story-feature-image relative aspect-[5/4] overflow-hidden rounded-2xl bg-[#e7e5de] sm:aspect-[4/3]">
                                        <Image
                                            src={articles[0].cover_image || "/assets/plates/program-photo.webp"}
                                            alt={articles[0].cover_image_alt || articles[0].title}
                                            fill
                                            unoptimized
                                            sizes="(max-width: 1024px) 100vw, 58vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                                        />
                                        <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#183b35] shadow-sm">Featured story</span>
                                    </div>
                                    <div className="home-story-feature-copy relative -mt-10 ml-5 rounded-tl-2xl bg-white px-6 pb-2 pt-6 sm:-mt-16 sm:ml-12 sm:px-9 sm:pt-8">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d85c43]">{articles[0].category?.name || "HOVUCA story"}</p>
                                        <h3 className="mt-3 max-w-xl text-2xl font-bold leading-[1.1] tracking-[-0.025em] text-[#183b35] sm:text-4xl">{articles[0].title}</h3>
                                        <p className="mt-4 max-w-xl line-clamp-3 text-sm leading-6 text-[#5b646a]">{articles[0].excerpt}</p>
                                        <span className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#d85c43]">Read the story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                                    </div>
                                </Link>
                            </article>
                        )}
                        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
                            {articles.slice(1).map((article) => (
                                <article key={article.id} data-home-reveal="story-side" className="home-story-side group min-w-0 border-t border-[#e0aa18] pt-5">
                                    <Link href={`/blog/${article.slug}`} className="grid gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d85c43] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] sm:items-start lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                                        <div className="home-story-side-image relative aspect-[5/3] overflow-hidden rounded-xl bg-[#e7e5de] sm:aspect-[4/5]">
                                            <Image
                                                src={article.cover_image || "/assets/plates/program-photo.webp"}
                                                alt={article.cover_image_alt || article.title}
                                                fill
                                                unoptimized
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 18vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d85c43]">{article.category?.name || "HOVUCA story"}</p>
                                            <h3 className="mt-3 text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-[#183b35]">{article.title}</h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5b646a]">{article.excerpt}</p>
                                            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#d85c43]">Read story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid bg-[#183b35] text-white lg:grid-cols-[0.78fr_1.22fr]" aria-labelledby="resources-heading">
                <div data-home-reveal="rise" className="flex min-h-[440px] flex-col justify-between border-b border-white/20 px-6 py-14 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
                    <SectionKicker light>Knowledge for action</SectionKicker>
                    <div>
                        <h2 id="resources-heading" className="max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
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
                        <Link key={resource.id} href="/documents" className="group grid min-h-[150px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-7 transition-colors hover:bg-white/5 lg:px-12">
                            <span className="text-sm text-[#f2c14e]">0{index + 1}</span>
                            <span>
                                <small className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{resource.category}</small>
                                <strong className="mt-3 block max-w-2xl text-xl font-bold leading-tight md:text-2xl">{resource.title}</strong>
                            </span>
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/35 text-[#f2c14e] transition-transform group-hover:translate-x-1" aria-hidden="true"><FileText className="h-5 w-5" /></span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="bg-white px-6 py-16 lg:px-12 lg:py-20" aria-labelledby="approach-cta-heading">
                <div className="mx-auto flex max-w-[1280px] flex-col gap-8 border-y border-[#183b35]/20 py-12 md:flex-row md:items-center md:justify-between md:gap-16 lg:py-14">
                    <div className="max-w-2xl">
                        <h2 id="approach-cta-heading" className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-[#183b35] md:text-4xl">
                            Explore the thinking behind the work.
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-7 text-[#566067]">
                            Learn more about HOVUCA’s approach to child protection, opportunity and community-led change.
                        </p>
                    </div>
                    <Link href="/about" className="group inline-flex min-h-12 w-fit shrink-0 items-center gap-5 rounded-full bg-[#183b35] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#294842] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">
                        About HOVUCA <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            <section className="grid lg:grid-cols-2" aria-labelledby="involved-heading">
                <div className="bg-[#e0aa18] px-6 py-16 text-[#183b35] lg:px-12 lg:py-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em]">Get involved</p>
                    <h2 id="involved-heading" className="mt-5 max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                        Bring your skills to the work.
                    </h2>
                    <p className="mt-7 max-w-xl text-base leading-7 text-[#294842]">Volunteer alongside programs rooted in local knowledge and shared responsibility.</p>
                    <Link href="/volunteers" className="mt-9 inline-flex items-center gap-3 rounded-full border border-[#183b35] px-6 py-3 text-sm font-semibold">Volunteer with us <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="bg-[#d85c43] px-6 py-16 text-white lg:px-12 lg:py-20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">Work together</p>
                    <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                        Build a lasting partnership.
                    </h2>
                    <p className="mt-7 max-w-xl text-base leading-7 text-white/80">Partner with HOVUCA to strengthen programs, knowledge and opportunity in Cameroon.</p>
                    <Link href="/contact" className="mt-9 inline-flex items-center gap-3 rounded-full border border-white px-6 py-3 text-sm font-semibold">Start a conversation <ArrowRight className="h-4 w-4" /></Link>
                </div>
            </section>

            <section className="bg-white px-6 py-20 lg:px-10 lg:py-24">
                <div className="mx-auto grid max-w-[1280px] gap-10 border-t border-[#183b35] pt-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
                    <div>
                        <SectionKicker>Stay connected</SectionKicker>
                        <h2 className="mt-6 max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-[#183b35] md:text-5xl">
                            Stories and opportunities, sent with purpose.
                        </h2>
                    </div>
                    <div>
                        {subscribed ? (
                            <p className="rounded-xl border border-[#183b35]/15 bg-[#f2f0ea] p-6 font-semibold text-[#183b35]">Thank you. You’re on the list.</p>
                        ) : (
                            <form
                                onSubmit={(event) => { event.preventDefault(); setSubscribed(true); setEmail(""); }}
                                className="flex flex-col overflow-hidden rounded-xl border border-[#183b35] sm:flex-row"
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
                    <nav aria-label="Follow HOVUCA on social media" className="text-center lg:col-span-2">
                        <p className="mb-3 text-sm font-semibold text-[#183b35]">Keep up with us on social media</p>
                        <div className="flex justify-center"><SocialLinks tone="dark" /></div>
                    </nav>
                </div>
            </section>
        </main>
    );
}
