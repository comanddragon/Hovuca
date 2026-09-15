import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import ProjectsDirectory from "@/components/projects/ProjectsDirectory";
export const metadata: Metadata = { title: "Projects", description: "Explore HOVUCA projects in child protection, education, and community development." };
export default function ProjectsPage() {
    return <div className="bg-[#f6f3eb] text-[#183b35]"><section className="grid lg:grid-cols-2"><div className="flex flex-col justify-center px-6 py-20 sm:px-12 lg:pl-[max(3rem,calc((100vw-1280px)/2+1.5rem))]"><h1 className="font-display text-6xl font-bold leading-[1.06] tracking-tight sm:text-7xl">Our work,<br />in action.</h1><p className="mt-8 max-w-lg text-lg leading-8 text-[#53645f]">Explore the projects that put child protection, learning, and community participation into practice.</p><a href="#project-directory" className="mt-8 flex min-h-12 w-fit items-center gap-3 border-b border-[#183b35] font-semibold">Explore projects <ArrowDown aria-hidden="true" className="size-4" /></a></div><div className="relative min-h-80 lg:min-h-[540px]"><Image src="/assets/plates/program-photo.webp" alt="A woman participating in a community activity" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></section><ProjectsDirectory /></div>;
}
