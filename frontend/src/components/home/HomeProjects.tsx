"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";

import "swiper/css";
import "swiper/css/effect-coverflow";

import { useProjects } from "@/hooks";

const fallbackProjects = [
    {
        id: "preview-community-protection",
        title: "Community-led child protection",
        excerpt:
            "A preview of how a project story could bring local protection work into focus.",
        cover_image: "/assets/plates/hero-photo.webp",
        cover_image_alt:
            "Young people taking part in a community-led discussion",
        href: "/projects",
        preview: true,
    },
    {
        id: "preview-learning-opportunity",
        title: "Learning and opportunity for girls",
        excerpt:
            "A preview of a project story about practical learning and opportunity.",
        cover_image: "/assets/plates/program-photo.webp",
        cover_image_alt: "A young woman learning a practical skill",
        href: "/projects",
        preview: true,
    },
    {
        id: "preview-youth-leadership",
        title: "Youth skills and leadership",
        excerpt:
            "A preview of a project story centered on young people shaping change.",
        cover_image: "/heros/hero1.webp",
        cover_image_alt:
            "Young people participating in a community activity",
        href: "/projects",
        preview: true,
    },
];

export default function HomeProjects() {
    const { data, isLoading, isError, refetch } = useProjects({ page: 1, page_size: 3 });
    const reduceMotion = useReducedMotion();
    const backendProjects = data?.results ?? [];

    const projects = backendProjects.length
        ? backendProjects.slice(0, 3).map((project) => ({
              id: project.id,
              title: project.title,
              excerpt: project.excerpt || project.description,
              cover_image: project.cover_image,
              cover_image_alt: project.cover_image_alt,
              href: `/projects/${project.slug}`,
              preview: false,
          }))
        : fallbackProjects;

    const showingPreviews = !isLoading && !isError && backendProjects.length === 0;
    const canBrowse = projects.length > 1;

    const swiperRef = useRef<SwiperClass | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(canBrowse);

    const activeProject = projects[activeIndex] ?? projects[0];

    const syncState = (swiper: SwiperClass) => {
        setActiveIndex(swiper.activeIndex);
        setHasPrev(!swiper.isBeginning);
        setHasNext(!swiper.isEnd);
    };

    const goToProject = (index: number) => {
        swiperRef.current?.slideTo(index);
    };

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || !canBrowse || reduceMotion) return;

        let isVisible = false;
        const syncAutoplay = () => {
            const autoplay = swiperRef.current?.autoplay;
            if (!autoplay) return;
            if (isVisible && !document.hidden && !section.matches(":focus-within")) autoplay.start();
            else autoplay.stop();
        };
        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            syncAutoplay();
        }, { threshold: 0.25 });

        observer.observe(section);
        document.addEventListener("visibilitychange", syncAutoplay);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", syncAutoplay);
        };
    }, [canBrowse, isError, isLoading, reduceMotion]);

    if (isLoading) {
        return (
            <section className="home-projects bg-[#f4f6f3] px-5 py-16 text-[#183b35]" aria-label="Featured projects" aria-busy="true">
                <div className="mx-auto max-w-[720px] animate-pulse text-center" role="status">
                    <span className="sr-only">Loading featured projects</span>
                    <div className="mx-auto h-3 w-28 rounded bg-[#183b35]/15" />
                    <div className="mx-auto mt-5 h-10 max-w-md rounded bg-[#183b35]/15" />
                    <div className="mt-10 aspect-video rounded-lg bg-[#183b35]/15" />
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section className="home-projects bg-[#f4f6f3] px-5 py-16 text-center text-[#183b35]" aria-label="Featured projects">
                <div className="mx-auto max-w-lg" role="alert">
                    <h2 className="text-2xl font-bold">Projects could not be loaded.</h2>
                    <p className="mt-3 text-sm leading-6 text-[#53645f]">Check your connection and try again.</p>
                    <button type="button" onClick={() => void refetch()} className="mt-6 min-h-11 rounded-full bg-[#183b35] px-6 text-sm font-semibold text-white">Try again</button>
                </div>
            </section>
        );
    }

    return (
        <section
            ref={sectionRef}
            className="home-projects bg-[#f4f6f3] py-8 text-[#183b35] md:py-12"
            aria-label={showingPreviews ? "Project previews" : "Featured projects"}
            data-home-reveal="projects"
        >
            <div className="home-project-copy mx-auto min-h-[260px] max-w-[620px] px-5 text-center">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        className={`home-project-copy-panel ${index === activeIndex ? "is-active" : ""}`}
                        aria-hidden={index !== activeIndex}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53645f]">
                            {showingPreviews ? "Project previews" : "Featured projects"}
                        </p>
                        <h2
                            className="mt-4 font-display text-3xl font-bold leading-[1.08] tracking-[-0.025em] sm:text-4xl"
                        >
                            {project.title}
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#53645f] sm:text-base">
                            {project.excerpt || "Explore the project details."}
                        </p>
                    </div>
                ))}
                <span className="sr-only" aria-live="polite">
                    Showing project {activeIndex + 1} of {projects.length}: {activeProject.title}
                </span>
            </div>

            <div className="home-project-viewport">
                <div
                    className="home-project-stage relative mx-auto max-w-[1300px] px-5"
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Featured projects"
                    onFocusCapture={() => swiperRef.current?.autoplay?.stop()}
                    onBlurCapture={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget) && !reduceMotion) swiperRef.current?.autoplay?.start();
                    }}
                >
                    <Swiper
                        modules={[Autoplay, EffectCoverflow]}
                        effect="coverflow"
                        centeredSlides
                        slidesPerView="auto"
                        watchSlidesProgress
                        grabCursor={canBrowse}
                        loop={false}
                        speed={reduceMotion ? 0 : 1000}
                        autoplay={
                            canBrowse && !reduceMotion
                                ? {
                                      delay: 5000,
                                      disableOnInteraction: false,
                                      pauseOnMouseEnter: true,
                                  }
                                : false
                        }
                        coverflowEffect={{
                            rotate: 10,
                            stretch: 80,
                            depth: 100,
                            modifier: 2,
                            slideShadows: false,
                        }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                            syncState(swiper);
                        }}
                        onSlideChange={syncState}
                        className="home-project-swiper"
                    >
                        {projects.map((project, index) => (
                            <SwiperSlide
                                key={project.id}
                                role="group"
                                aria-label={`${index + 1} / ${projects.length}`}
                                className="home-project-slide"
                            >
                                <Link
                                    href={project.href}
                                    onClick={(event) => {
                                        if (index === activeIndex) return;
                                        event.preventDefault();
                                        goToProject(index);
                                    }}
                                    tabIndex={
                                        index === activeIndex ? 0 : -1
                                    }
                                    className="home-project-card group relative block aspect-video w-full overflow-hidden rounded-lg bg-[#183b35] focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e0aa18]"
                                    aria-label={
                                        project.preview
                                            ? `Explore projects: ${project.title} preview`
                                            : `Read about ${project.title}`
                                    }
                                >
                                    {project.cover_image ? (
                                        <Image
                                            src={project.cover_image}
                                            alt={
                                                project.cover_image_alt ||
                                                project.title
                                            }
                                            fill
                                            sizes="(max-width: 719px) 80vw, (max-width: 979px) 580px, 720px"
                                            className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.025]"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#234d44] px-10 text-center font-display text-3xl font-bold text-white sm:text-5xl">
                                            {project.title}
                                        </div>
                                    )}

                                    <div
                                        className="home-project-card-copy absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-6 pb-8 pt-24 text-center text-white sm:px-8"
                                    >
                                        <span className="font-display text-lg font-bold leading-tight sm:text-2xl">
                                            {project.title}
                                        </span>
                                        <span className="mx-auto mt-4 flex w-fit items-center gap-2 border-b border-white pb-1 text-sm font-semibold">
                                            Read more <ArrowUpRight aria-hidden="true" className="size-4" />
                                        </span>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {canBrowse && (
                        <>
                            <button
                                suppressHydrationWarning
                                type="button"
                                onClick={() => swiperRef.current?.slidePrev()}
                                disabled={!hasPrev}
                                aria-label="Previous project"
                                aria-disabled={!hasPrev}
                                className={`home-project-arrow home-project-arrow-prev absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] sm:flex lg:-left-5 ${
                                    hasPrev
                                        ? "bg-[#d85c43] hover:bg-[#b84733]"
                                        : "cursor-not-allowed bg-[#d85c43]/35"
                                }`}
                            >
                                <ArrowLeft
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>

                            <button
                                suppressHydrationWarning
                                type="button"
                                onClick={() =>
                                    swiperRef.current?.slideNext()
                                }
                                disabled={!hasNext}
                                aria-label="Next project"
                                aria-disabled={!hasNext}
                                className={`home-project-arrow home-project-arrow-next absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] sm:flex lg:-right-5 ${
                                    hasNext
                                        ? "bg-[#d85c43] hover:bg-[#b84733]"
                                        : "cursor-not-allowed bg-[#d85c43]/35"
                                }`}
                            >
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {canBrowse && (
                <div
                    className="home-project-pagination flex items-center justify-center"
                    role="group"
                    aria-label="Choose a project"
                >
                    {projects.map((project, index) => (
                        <button
                            suppressHydrationWarning
                            key={project.id}
                            type="button"
                            onClick={() => goToProject(index)}
                            aria-label={`Show project ${index + 1}: ${project.title}`}
                            aria-current={
                                index === activeIndex
                                    ? "true"
                                    : undefined
                            }
                            className="flex h-16 w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]"
                        >
                            <span
                                aria-hidden="true"
                                className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-in-out ${
                                    index === activeIndex
                                        ? "w-10 bg-[#d85c43]"
                                        : "w-2 bg-[#686a6c]"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-0 text-center">
                <Link
                    href="/projects"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d85c43] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(24,59,53,0.12)] transition-colors hover:bg-[#b84733] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]"
                >
                    All projects
                    <ArrowUpRight
                        aria-hidden="true"
                        className="size-4"
                    />
                </Link>
            </div>
        </section>
    );
}
