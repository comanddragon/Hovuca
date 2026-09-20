import type { Metadata } from "next";
import StoriesDirectory from "@/components/blog/StoriesDirectory";

export const metadata: Metadata = { title: "Field stories", description: "Community voices, advocacy updates and lessons from HOVUCA’s work with children and young people." };

export default function BlogPage() {
    return <div className="bg-white text-[#183b35]">
        <header className="mx-auto grid max-w-[1280px] gap-10 border-b border-[#183b35]/20 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:items-end md:py-20">
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#46525b]">
                <span className="h-px w-12 bg-[#e0aa18]" aria-hidden="true" />Field stories
            </p>
            <div>
                <h1 className="max-w-2xl text-4xl font-bold leading-[1.03] tracking-[-0.03em] sm:text-6xl">Voices from the work, one dispatch at a time.</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[#566067]">Community voices, advocacy updates and lessons from our work with children and young people across Cameroon.</p>
            </div>
        </header>
        <StoriesDirectory />
    </div>;
}
