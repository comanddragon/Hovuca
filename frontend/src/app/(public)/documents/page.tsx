import type { Metadata } from "next";
import DocumentsLibrary from "@/components/documents/DocumentsLibrary";
export const metadata: Metadata = { title: "Documents", description: "Explore HOVUCA policies, reports, advocacy briefs, presentations and publications." };
export default function DocumentsPage() {
    return <div className="bg-[#f6f3eb] text-[#183b35]">
        <header className="bg-[#183b35] text-[#f6f3eb]"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <h1 className="font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-7xl">Knowledge<br />worth sharing.</h1>
            <p className="max-w-xl text-lg leading-8 text-[#f6f3eb]/80">Policies, reports, advocacy briefs, presentations and publications from HOVUCA. Explore the library and take the resources with you.</p>
        </div></header>
        <DocumentsLibrary />
    </div>;
}
