"use client";

import Image from "next/image";
import React from 'react';
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, FileText, Handshake, HeartPulse, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import DonorCarousel from "@/components/home/DonorCarousel";
import HomeProjects from "@/components/home/HomeProjects";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";
import { useArticles, usePrograms, useResources } from "@/hooks";
import { CommunityPattern } from "@/components/illustrations/CommunityPattern";
import { ResourceLibrary } from "@/components/illustrations/ResourceLibrary";

const evidenceLinks = [
    { number: "01", label: "Programs", href: "/programs" },
    { number: "02", label: "Field stories", href: "/blog" },
    { number: "03", label: "Publications", href: "/resources" },
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

const programIcons = [ShieldCheck, Sparkles, HeartPulse];

function SectionKicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
    return (
        <p className={`flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.28em] ${light ? "text-brand-white/75" : "text-muted-foreground"}`}>
            <span className="h-px w-12 bg-brand-gold" aria-hidden="true" />
            {children}
        </p>
    );
}

export function HomeView() {
    const { data: programData, isLoading: programsLoading, isError: programsError, refetch: refetchPrograms } = usePrograms({ page: 1, page_size: 3 });
    const { data: articleData, isLoading: articlesLoading, isError: articlesError, refetch: refetchArticles } = useArticles({ page: 1, page_size: 3 });
    const { data: resources = [], isLoading: resourcesLoading, isError: resourcesError, refetch: refetchResources } = useResources();

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

    const programsArePreviews = !programsLoading && !programsError && !programData?.results?.length;
    const storiesArePreviews = !articlesLoading && !articlesError && !articleData?.results?.length;
    const resourcesArePreviews = !resourcesLoading && !resourcesError && !resources.length;
    const programs = (programData?.results?.length ? programData.results : programsArePreviews ? fallbackPrograms : []).slice(0, 3);
    const articles = (articleData?.results?.length ? articleData.results : storiesArePreviews ? fallbackStories : []).slice(0, 3);
    const displayedResources = (resources.length ? resources.slice(0, 3) : resourcesArePreviews ? [
        { id: "policy", title: "Child Protection Policy", category: "Policy" },
        { id: "rights", title: "Promotion of the Rights of the Child in Cameroon", category: "Publication" },
        { id: "advocacy", title: "Advocacy Brief", category: "Advocacy" },
    ] : []);

    return (
        <div className="w-full overflow-hidden bg-brand-white text-primary">
            <div className="grid h-[100svh] min-h-[640px] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto]">
                <section className="relative min-h-0 min-w-0 overflow-hidden" aria-labelledby="home-heading">
                    <Image
                        src="/assets/plates/hero-photo.webp"
                        alt="Young people taking part in a community-led discussion in Cameroon"
                        fill
                        priority
                        sizes="100vw"
                        className="home-hero-photo object-cover object-[54%_center] lg:object-center"
                    />
                    <CommunityPattern className="pointer-events-none absolute right-8 top-16 hidden w-56 text-brand-white/70 lg:block" />

                    <div className="home-hero-panel absolute inset-x-5 bottom-0 rounded-t-xl bg-brand-white px-6 py-6 text-primary sm:inset-x-auto sm:left-8 sm:w-[440px] lg:left-[clamp(1.5rem,2.6vw,2.5rem)] lg:w-[min(32vw,460px)] lg:min-w-[390px] lg:px-8 lg:py-7">
                        <h1
                            id="home-heading"
                            className="max-w-[400px] text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[2.75rem] lg:text-[clamp(2.55rem,3vw,3rem)]"
                        >
                            Young people<br />are partners<br />in change.
                        </h1>
                        <span className="home-hero-rule mt-5 block h-1 w-10 origin-left bg-brand-gold" aria-hidden="true" />
                        <p className="mt-3 max-w-[390px] text-[0.95rem] leading-[1.42] text-muted-foreground lg:text-[clamp(0.95rem,1.2vw,1.08rem)]">
                            At HOVUCA, young people lead, collaborate and create solutions for stronger, more inclusive communities in Cameroon.
                        </p>
                        <Link
                            href="/projects"
                            data-home-action
                            className="group mt-5 inline-flex h-11 w-[210px] items-center justify-between rounded-full bg-brand-coral-dark px-4 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-coral-deep focus-visible:bg-brand-coral-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                        >
                            Explore our impact <ArrowRight className="h-7 w-7 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1" strokeWidth={1.5} />
                        </Link>
                    </div>

                    <aside className="absolute right-0 top-[15.9%] hidden w-[124px] overflow-hidden rounded-l-xl bg-brand-white text-primary lg:block" aria-label="Explore HOVUCA evidence">
                        {evidenceLinks.map((item, index) => (
                            <Link
                                key={item.number}
                                href={item.href}
                                className="group relative flex h-[8.26vw] max-h-[124px] flex-col justify-center border-b border-brand-gold/65 px-5 last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold"
                            >
                                {index === 0 && <span className="absolute inset-y-8 left-3 w-[3px] bg-brand-gold" aria-hidden="true" />}
                                <span
                                    className={`text-[1.35rem] leading-none ${index === 0 ? "text-brand-gold-dark" : "text-brand-slate-deep"}`}
                                >
                                    {item.number}
                                </span>
                                <span className="mt-2 text-xs font-semibold text-primary transition-colors group-hover:text-brand-coral-dark">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </aside>

                    <span className="absolute bottom-[18px] right-[315px] hidden h-px w-8 bg-brand-gold md:block" aria-hidden="true" />
                    <p className="absolute bottom-1.5 right-[30px] hidden h-[19px] w-[285px] items-center border-b border-primary/25 bg-brand-periwinkle px-1 text-[11px] font-normal text-brand-white md:flex">
                        Centre Region, Cameroon · Community-led program
                    </p>
                </section>

                <section className="min-w-0 overflow-hidden bg-brand-white py-6">
                    <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Partners in the work</p>
                    <DonorCarousel />
                </section>
            </div>

            <section className="home-deferred-section home-programs bg-brand-white px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="programs-heading" data-home-reveal="programs">
                <div className="mx-auto max-w-[1280px]">
                    <div className="home-program-heading grid gap-10 border-b border-primary/25 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                        <SectionKicker>{programsArePreviews ? "Program previews" : "Where we work"}</SectionKicker>
                        <div>
                            <h2 id="programs-heading" className="max-w-3xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-primary md:text-6xl">
                                Programs shaped around real lives.
                            </h2>
                            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
                                We work with children, girls, young people and local partners to turn knowledge into practical, community-led action.
                            </p>
                        </div>
                    </div>

                    <div className="home-program-list grid lg:grid-cols-3">
                        {programsLoading && <p className="col-span-full py-16 text-center text-sm text-muted-foreground" role="status">Loading programs…</p>}
                        {programsError && (
                            <div className="col-span-full py-14 text-center" role="alert">
                                <p className="font-semibold">Programs could not be loaded.</p>
                                <button type="button" onClick={() => void refetchPrograms()} className="mt-4 min-h-11 rounded-full border border-primary px-5 text-sm font-semibold">Try again</button>
                            </div>
                        )}
                        {programs.map((program, index) => (
                            (() => {
                                const ProgramIcon = programIcons[index % programIcons.length];

                                return (
                            <article
                                key={program.id}
                                className="flex min-h-[300px] flex-col border-b border-primary/25 px-0 py-9 text-primary lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0 lg:first:pl-0"
                            >
                                <span className="flex items-center justify-between">
                                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-coral text-brand-white">
                                        <ProgramIcon aria-hidden="true" className="size-6" strokeWidth={1.8} />
                                    </span>
                                    <span className="text-sm text-brand-coral-dark">0{index + 1}</span>
                                </span>
                                <h3 className="mt-auto max-w-sm text-3xl font-bold leading-[1.07] tracking-[-0.025em]">
                                    {program.title}
                                </h3>
                                <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">{program.excerpt}</p>
                            </article>
                                );
                            })()
                        ))}
                    </div>
                </div>
            </section>

            <HomeProjects />

            <section className="home-deferred-section px-6 py-20 lg:px-12 lg:py-24" aria-labelledby="stories-heading">
                <div className="mx-auto max-w-[1280px]">
                    <div data-home-reveal="rise" className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                        <div>
                            <SectionKicker>{storiesArePreviews ? "Story previews" : "Field stories"}</SectionKicker>
                            <h2 id="stories-heading" className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-primary md:text-6xl">
                                Voices from the work.
                            </h2>
                        </div>
                        <Link href="/blog" data-home-action className="inline-flex items-center gap-3 text-sm font-semibold text-brand-coral-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
                            Read all stories <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
                        {articlesLoading && <p className="lg:col-span-2 py-16 text-center text-sm text-muted-foreground" role="status">Loading stories…</p>}
                        {articlesError && (
                            <div className="lg:col-span-2 py-14 text-center" role="alert">
                                <p className="font-semibold">Stories could not be loaded.</p>
                                <button type="button" onClick={() => void refetchArticles()} className="mt-4 min-h-11 rounded-full border border-primary px-5 text-sm font-semibold">Try again</button>
                            </div>
                        )}
                        {articles[0] && (
                            <article data-home-reveal="story-feature" className="home-story-feature group min-w-0">
                                <Link href={storiesArePreviews ? "/blog" : `/blog/${articles[0].slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-coral">
                                    <div className="home-story-feature-image relative aspect-[5/4] overflow-hidden rounded-2xl bg-brand-sand sm:aspect-[4/3]">
                                        <Image
                                            src={articles[0].cover_image || "/assets/plates/program-photo.webp"}
                                            alt={articles[0].cover_image_alt || articles[0].title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 58vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                                        />
                                        <span className="absolute left-5 top-5 rounded-full bg-brand-white/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary shadow-sm">Featured story</span>
                                    </div>
                                    <div className="home-story-feature-copy relative -mt-16 ml-5 rounded-tl-2xl bg-brand-white px-6 pb-2 pt-6 sm:-mt-24 sm:ml-12 sm:px-9 sm:pt-8">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-coral-dark">{articles[0].category?.name || "HOVUCA story"}</p>
                                        <h3 className="mt-3 max-w-xl text-2xl font-bold leading-[1.1] tracking-[-0.025em] text-primary sm:text-4xl">{articles[0].title}</h3>
                                        <p className="mt-4 max-w-xl line-clamp-3 text-sm leading-6 text-muted-foreground">{articles[0].excerpt}</p>
                                        <span className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-brand-coral-dark">Read the story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                                    </div>
                                </Link>
                            </article>
                        )}
                        <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
                            {articles.slice(1).map((article) => (
                                <article key={article.id} data-home-reveal="story-side" className="home-story-side group min-w-0 border-t border-brand-gold pt-5">
                                    <Link href={storiesArePreviews ? "/blog" : `/blog/${article.slug}`} className="grid grid-cols-[0.8fr_1fr] items-start gap-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-coral">
                                        <div className="home-story-side-image relative z-0 aspect-[4/5] overflow-hidden rounded-xl bg-brand-sand">
                                            <Image
                                                src={article.cover_image || "/assets/plates/program-photo.webp"}
                                                alt={article.cover_image_alt || article.title}
                                                fill
                                                sizes="(max-width: 640px) 40vw, (max-width: 1024px) 40vw, 18vw"
                                                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                            />
                                        </div>
                                        <div className="relative z-10 -ml-8 mt-[20%] min-w-0 rounded-2xl bg-brand-white px-6 py-5 sm:-ml-10 sm:px-7 sm:py-6">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-coral-dark">{article.category?.name || "HOVUCA story"}</p>
                                            <h3 className="mt-3 text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-primary">{article.title}</h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p>
                                            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-coral-dark">Read story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-deferred-section home-resources grid bg-primary text-brand-white lg:grid-cols-[0.78fr_1.22fr]" aria-labelledby="resources-heading" data-home-reveal="resources">
                <div className="home-resource-intro relative flex min-h-[440px] flex-col justify-between overflow-hidden border-b border-brand-white/20 px-6 py-14 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">
                    <ResourceLibrary className="pointer-events-none absolute -bottom-7 -right-8 w-72 text-brand-gold-light/35 sm:-bottom-10 sm:right-0 sm:w-80" />
                    <SectionKicker light>{resourcesArePreviews ? "Resource previews" : "Knowledge for action"}</SectionKicker>
                    <div className="relative">
                        <h2 id="resources-heading" className="max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                            Resources made to be used.
                        </h2>
                        <p className="mt-6 max-w-lg text-base leading-7 text-brand-white/70">
                            Explore policies, reports, advocacy materials and practical learning from our work in Cameroon.
                        </p>
                        <Link href="/documents" data-home-action className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-brand-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold-light">
                            Browse publications <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
                <div className="home-resource-list divide-y divide-white/20">
                    {resourcesLoading && <p className="flex min-h-[150px] items-center justify-center px-6 text-sm text-brand-white/70" role="status">Loading resources…</p>}
                    {resourcesError && (
                        <div className="flex min-h-[150px] flex-col items-center justify-center px-6 text-center" role="alert">
                            <p className="font-semibold">Resources could not be loaded.</p>
                            <button type="button" onClick={() => void refetchResources()} className="mt-4 min-h-11 rounded-full border border-brand-white/60 px-5 text-sm font-semibold">Try again</button>
                        </div>
                    )}
                    {displayedResources.map((resource, index) => (
                        <Link key={resource.id} href="/documents" className="group grid min-h-[150px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-7 transition-colors hover:bg-brand-white/5 lg:px-12">
                            <span className="text-sm text-brand-gold-light">0{index + 1}</span>
                            <span>
                                <small className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-white/55">{resource.category}</small>
                                <strong className="mt-3 block max-w-2xl text-xl font-bold leading-tight md:text-2xl">{resource.title}</strong>
                            </span>
                            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-brand-white/35 text-brand-gold-light transition-transform group-hover:translate-x-1" aria-hidden="true"><FileText className="h-5 w-5" /></span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="home-deferred-section bg-brand-white px-6 py-16 lg:px-12 lg:py-20" aria-labelledby="approach-cta-heading" data-home-reveal="approach">
                <div className="home-approach mx-auto flex max-w-[1280px] flex-col gap-8 border-y border-primary/20 py-12 md:flex-row md:items-center md:justify-between md:gap-16 lg:py-14">
                    <div className="max-w-2xl">
                        <h2 id="approach-cta-heading" className="text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-primary md:text-4xl">
                            Explore the thinking behind the work.
                        </h2>
                        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                            Learn more about HOVUCA’s approach to child protection, opportunity and community-led change.
                        </p>
                    </div>
                    <Link href="/about" data-home-action className="group inline-flex min-h-12 w-fit shrink-0 items-center gap-5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-teal-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        About HOVUCA <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            <section className="home-deferred-section home-involved grid overflow-hidden lg:grid-cols-2" aria-labelledby="involved-heading" data-home-reveal="involved">
                <div className="home-involved-panel home-involved-panel-start relative isolate overflow-hidden bg-brand-gold px-6 py-16 text-primary lg:px-12 lg:py-20">
                    <div className="pointer-events-none absolute inset-0 z-0 md:left-auto md:w-[42%]">
                        <Image src="/images/home/program-skills.webp" alt="" fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover object-center opacity-25 mix-blend-multiply md:opacity-85" />
                    </div>
                    <div className="absolute inset-y-0 right-[38%] z-[1] hidden w-24 bg-brand-gold/80 md:block" aria-hidden="true" />
                    <div className="relative z-10 max-w-xl">
                    <span className="flex size-14 items-center justify-center rounded-full bg-primary text-brand-white shadow-lg shadow-primary/15">
                        <UsersRound aria-hidden="true" className="size-7" strokeWidth={1.8} />
                    </span>
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.28em]">Get involved</p>
                    <h2 id="involved-heading" className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                        Bring your skills to the work.
                    </h2>
                    <p className="mt-7 text-base leading-7 text-brand-teal-muted">Volunteer alongside programs rooted in local knowledge and shared responsibility.</p>
                    <Link href="/volunteers" data-home-action className="mt-9 inline-flex items-center gap-3 rounded-full border border-primary px-6 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Volunteer with us <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
                <div className="home-involved-panel home-involved-panel-end relative isolate overflow-hidden bg-brand-coral-dark px-6 py-16 text-brand-white lg:px-12 lg:py-20">
                    <div className="pointer-events-none absolute inset-0 z-0 md:left-auto md:w-[42%]">
                        <Image src="/images/home/hero-discussion.webp" alt="" fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover object-center opacity-25 md:opacity-65" />
                    </div>
                    <div className="absolute inset-y-0 right-[38%] z-[1] hidden w-24 bg-brand-coral-dark/85 md:block" aria-hidden="true" />
                    <div className="relative z-10 max-w-xl">
                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-white text-brand-coral-dark shadow-lg shadow-primary/15">
                        <Handshake aria-hidden="true" className="size-7" strokeWidth={1.8} />
                    </span>
                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-white/75">Work together</p>
                    <h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
                        Build a lasting partnership.
                    </h2>
                    <p className="mt-7 text-base leading-7 text-brand-white/80">Partner with HOVUCA to strengthen programs, knowledge and opportunity in Cameroon.</p>
                    <Link href="/contact" data-home-action className="mt-9 inline-flex items-center gap-3 rounded-full border border-brand-white px-6 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start a conversation <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
            </section>

            <section className="home-deferred-section bg-brand-white px-6 py-20 lg:px-10 lg:py-24">
                <div className="mx-auto grid max-w-[1280px] gap-10 border-t border-primary pt-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
                    <div>
                        <SectionKicker>Stay connected</SectionKicker>
                        <h2 className="mt-6 max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-primary md:text-5xl">
                            Stories and opportunities, sent with purpose.
                        </h2>
                    </div>
                    <div>
                        <div className="rounded-xl border border-primary/20 bg-brand-surface p-6">
                            <p className="font-semibold text-primary">Get HOVUCA updates in your inbox.</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">Field stories, resources, and opportunities from our work with communities.</p>
                            <NewsletterSignup />
                        </div>
                    </div>
                    <nav aria-label="Follow HOVUCA on social media" className="text-center lg:col-span-2">
                        <p className="mb-3 text-sm font-semibold text-primary">Keep up with us on social media</p>
                        <div className="flex justify-center"><SocialLinks tone="dark" /></div>
                    </nav>
                </div>
            </section>
        </div>
    );
}

export default HomeView;
