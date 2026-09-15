import type { Metadata } from "next";
import StoriesDirectory from "@/components/blog/StoriesDirectory";
export const metadata: Metadata = { title: "Field stories", description: "Community voices, advocacy updates and lessons from HOVUCA’s work with children and young people." };
export default function BlogPage() {
    return <div className="bg-[#f6f3eb] text-[#183b35]">
        <header className="border-b border-[#183b35]/20"><div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
            <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-7xl">Stories from<br />our shared work.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#53645f]">Community voices, advocacy updates and lessons from our work with children and young people.</p>
        </div></header>
        <StoriesDirectory />
    </div>;
}
