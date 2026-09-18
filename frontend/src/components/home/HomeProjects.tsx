"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useProjects } from "@/hooks";

const fallbackProjects = [
    {
        id: "preview-community-protection",
        title: "Community-led child protection",
        excerpt: "A preview of how a project story could bring local protection work into focus.",
        cover_image: "/assets/plates/hero-photo.webp",
        cover_image_alt: "Young people taking part in a community-led discussion",
        href: "/projects",
        preview: true,
    },
    {
        id: "preview-learning-opportunity",
        title: "Learning and opportunity for girls",
        excerpt: "A preview of a project story about practical learning and opportunity.",
        cover_image: "/assets/plates/program-photo.webp",
        cover_image_alt: "A young woman learning a practical skill",
        href: "/projects",
        preview: true,
    },
    {
        id: "preview-youth-leadership",
        title: "Youth skills and leadership",
        excerpt: "A preview of a project story centered on young people shaping change.",
        cover_image: "/heros/hero1.webp",
        cover_image_alt: "Young people participating in a community activity",
        href: "/projects",
        preview: true,
    },
];

export default function HomeProjects() {
    const { data } = useProjects({ page: 1, page_size: 5 });
    const backendProjects = data?.results ?? [];

    const projects = backendProjects.length
        ? backendProjects.map((project) => ({
              id: project.id,
              title: project.title,
              excerpt: project.excerpt || project.description,
              cover_image: project.cover_image,
              cover_image_alt: project.cover_image_alt,
              href: `/projects/${project.slug}`,
              preview: false,
          }))
        : fallbackProjects;

    const showingPreviews = backendProjects.length === 0;
    const [selected, setSelected] = useState(0);

    const activeIndex = Math.min(
        selected,
        Math.max(projects.length - 1, 0)
    );

    const activeProject = projects[activeIndex];
    const canBrowse = projects.length > 1;

    const move = (direction: number) => {
        setSelected(
            (current) =>
                (current + direction + projects.length) % projects.length
        );
    };

    return (
        <section
            className="overflow-hidden bg-[#f4f6f3] px-4 py-16 text-[#183b35] sm:px-6 lg:py-20"
            aria-labelledby="home-projects-heading"
        >
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53645f]">
                    {showingPreviews
                        ? "Project previews"
                        : "Featured projects"}
                </p>

                <h2
                    id="home-projects-heading"
                    className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl"
                    aria-live="polite"
                >
                    {activeProject.title}
                </h2>

                <p
                    className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#53645f] sm:text-base"
                    aria-live="polite"
                >
                    {activeProject.excerpt || "Explore the project details."}
                </p>
            </div>

            <div
                className="home-project-stage relative mx-auto mt-12 h-[310px] max-w-[1360px] sm:h-[clamp(310px,25vw,440px)]"
                aria-roledescription="carousel"
                aria-label="Featured projects"
            >
                {projects.map((project, index) => {
                    const relative =
                        (index - activeIndex + projects.length) %
                        projects.length;

                    const position =
                        relative === 0
                            ? "active"
                            : relative === 1
                              ? "next"
                              : relative === projects.length - 1 &&
                                  projects.length > 2
                                ? "previous"
                                : "hidden";

                    return (
                        <article
                            key={project.id}
                            className="home-project-slide absolute left-1/2 top-0 h-full rounded-xl bg-[#183b35] text-white"
                            data-position={position}
                            aria-hidden={position === "hidden"}
                        >
                            <Link
                                href={project.href}
                                tabIndex={position === "hidden" ? -1 : 0}
                                className="group relative block h-full w-full overflow-hidden rounded-xl focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#e0aa18]"
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
                                        sizes="(max-width: 640px) 86vw, 760px"
                                        className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#234d44] px-10 text-center font-display text-3xl font-bold sm:text-5xl">
                                        {project.title}
                                    </div>
                                )}

                                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-gradient-to-t from-[#102c28]/90 via-[#102c28]/45 to-transparent px-6 pb-6 pt-24 sm:px-9 sm:pb-8">
                                    <span className="max-w-[28rem] font-display text-lg font-bold leading-tight sm:text-xl">
                                        {project.title}
                                    </span>

                                    <span className="inline-flex shrink-0 items-center gap-2 border-b border-[#e0aa18] pb-1 text-sm font-semibold">
                                        {project.preview
                                            ? "Preview"
                                            : "Read project"}
                                        <ArrowUpRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                </span>
                            </Link>

                            {canBrowse && position === "previous" && (
                                <button
                                    suppressHydrationWarning
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        move(-1);
                                    }}
                                    aria-label="Previous project"
                                    className="home-project-arrow absolute left-0 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#d85c43] text-white shadow-md transition-colors hover:bg-[#b84733] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]"
                                >
                                    <ArrowLeft
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </button>
                            )}

                            {canBrowse && position === "next" && (
                                <button
                                    suppressHydrationWarning
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        move(1);
                                    }}
                                    aria-label="Next project"
                                    className="home-project-arrow absolute right-0 top-1/2 z-20 flex translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#d85c43] text-white shadow-md transition-colors hover:bg-[#b84733] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]"
                                >
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </button>
                            )}
                        </article>
                    );
                })}
            </div>

            {canBrowse && (
                <div
                    className="mt-6 flex items-center justify-center"
                    role="group"
                    aria-label="Choose a project"
                >
                    {projects.map((project, index) => (
                        <button
                            suppressHydrationWarning
                            key={project.id}
                            type="button"
                            onClick={() => setSelected(index)}
                            aria-label={`Show project ${index + 1}: ${project.title}`}
                            aria-current={
                                index === activeIndex ? "true" : undefined
                            }
                            className="flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]"
                        >
                            <span
                                aria-hidden="true"
                                className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                                    index === activeIndex
                                        ? "w-8 bg-[#d85c43]"
                                        : "w-2 bg-[#d85c43]/35"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-10 text-center">
                <Link
                    href="/projects"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d85c43] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(24,59,53,0.12)] transition-colors hover:bg-[#b84733] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]"
                >
                    All projects
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
            </div>
        </section>
    );
}