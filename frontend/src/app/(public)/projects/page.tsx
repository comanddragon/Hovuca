import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import ProjectsDirectory from "@/components/projects/ProjectsDirectory";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Our Projects",
    description:
        "Explore HOVUCA's practical projects that put child protection, learning, and community participation into action across Cameroon.",
    path: "/projects",
    keywords: [
        "HOVUCA projects",
        "community development projects",
        "child protection Cameroon",
        "education projects Africa",
        "grassroots action",
    ],
});

export default function ProjectsPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Projects", path: "/projects" },
    ]);

    return (
        <div className="bg-background text-primary">
            <JsonLd data={breadcrumbs} />
            <section className="grid lg:grid-cols-2">
                <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:pl-[max(3rem,calc((100vw-1280px)/2+1.5rem))]">
                    <h1 className="font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-6xl">
                        Our work,<br />in action.
                    </h1>
                    <p className="mt-7 max-w-lg text-base leading-7 text-muted-foreground">
                        Explore the projects that put child protection, learning, and community participation into practice.
                    </p>
                    <a
                        href="#project-directory"
                        className="mt-7 flex min-h-11 w-fit items-center gap-3 rounded-full border border-primary px-5 text-sm font-semibold"
                    >
                        Explore projects <ArrowDown aria-hidden="true" className="size-4" />
                    </a>
                </div>
                <div className="relative min-h-72 lg:min-h-[460px]">
                    <Image
                        src="/assets/plates/program-photo.webp"
                        alt="A woman participating in a community activity"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                    />
                </div>
            </section>
            <ProjectsDirectory />
        </div>
    );
}
