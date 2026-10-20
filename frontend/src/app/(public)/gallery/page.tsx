import type { Metadata } from "next";
import { GalleryView } from "@/components/gallery/GalleryView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Photo & Video Gallery",
    description:
        "Moments from the field: Explore photos and videos of HOVUCA's community-led workshops, advocacy campaigns, and youth empowerment projects across Cameroon.",
    path: "/gallery",
    keywords: [
        "HOVUCA gallery",
        "community photos Cameroon",
        "NGO field images",
        "youth workshops pictures",
    ],
});

export default function GalleryPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Gallery", path: "/gallery" },
    ]);

    return (
        <>
            <JsonLd data={breadcrumbs} />
            <GalleryView />
        </>
    );
}
