import type { Metadata } from "next";
import { HomeView } from "@/components/home/HomeView";
import { constructMetadata, getWebsiteSchema, SITE_CONFIG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.legalName}`,
    description: SITE_CONFIG.description,
    path: "/",
});

export default function HomePage() {
    const websiteSchema = getWebsiteSchema();

    return (
        <>
            <JsonLd data={websiteSchema} />
            <HomeView />
        </>
    );
}
