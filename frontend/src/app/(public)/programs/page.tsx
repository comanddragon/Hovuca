import type { Metadata } from "next";
import { ProgramsView } from "@/components/programs/ProgramsView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Our Programs",
    description:
        "High-impact initiatives in education, health, child protection, and community development across Cameroon — built for lasting change.",
    path: "/programs",
    keywords: [
        "HOVUCA programs",
        "child protection Cameroon",
        "girls empowerment",
        "youth initiatives Africa",
        "community health Cameroon",
    ],
});

export default function ProgramsPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Programs", path: "/programs" },
    ]);

    return (
        <>
            <JsonLd data={breadcrumbs} />
            <ProgramsView />
        </>
    );
}
