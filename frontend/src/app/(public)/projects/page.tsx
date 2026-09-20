import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import ProjectsDirectory from "@/components/projects/ProjectsDirectory";
export const metadata: Metadata = { title: "Projects", description: "Explore HOVUCA projects in child protection, education, and community development." };
export default function ProjectsPage() {
    return <div className="bg-[var(--brand-paper)] text-[var(--brand-forest)]"><section className="grid lg:grid-cols-2"><div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:pl-[max(3rem,calc((100vw-1280px)/2+1.5rem))]"><h1 className="font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-6xl">Our work,<br />in action.</h1><p className="mt-7 max-w-lg text-base leading-7 text-[var(--brand-body-muted)]">Explore the projects that put child protection, learning, and community participation into practice.</p><a href="#project-directory" className="mt-7 flex min-h-11 w-fit items-center gap-3 rounded-full border border-[var(--brand-forest)] px-5 text-sm font-semibold">Explore projects <ArrowDown aria-hidden="true" className="size-4" /></a></div><div className="relative min-h-72 lg:min-h-[460px]"><Image src="/assets/plates/program-photo.webp" alt="A woman participating in a community activity" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></section><ProjectsDirectory /></div>;
}
