import type { Metadata } from "next";
import DocumentsLibrary from "@/components/documents/DocumentsLibrary";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Publications, Policies & Advocacy Documents",
    description:
        "Access HOVUCA’s library of child protection policies, research reports, advocacy briefs, toolkits, and publications in Cameroon.",
    path: "/resources",
    keywords: [
        "HOVUCA publications",
        "child protection policy Cameroon",
        "advocacy briefs Africa",
        "research reports Cameroon NGO",
        "NGO policy resources",
    ],
});

export default function DocumentsPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Documents", path: "/resources" },
    ]);

    return (
        <div className="bg-white text-primary">
            <JsonLd data={breadcrumbs} />
            <header className="bg-primary text-primary-foreground">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-end">
                    <h1 className="font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-7xl">
                        Knowledge<br />worth sharing.
                    </h1>
                    <p className="max-w-xl text-lg leading-8 text-primary-foreground/80">
                        Policies, reports, advocacy briefs, presentations and publications from HOVUCA. Explore the library and take the resources with you.
                    </p>
                </div>
            </header>
            <DocumentsLibrary />
        </div>
    );
}