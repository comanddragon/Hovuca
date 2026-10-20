import type { Metadata } from "next";
import { EventsView } from "@/components/events/EventsView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Upcoming Events & Community Workshops",
    description:
        "Connect, learn, and grow with our community. Join HOVUCA workshops, advocacy forums, and impact events across Cameroon and online.",
    path: "/events",
    keywords: [
        "HOVUCA events",
        "Cameroon NGO workshops",
        "child protection seminars",
        "community gatherings Yaoundé",
        "advocacy forums",
    ],
});

export default function EventsPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
    ]);

    return (
        <>
            <JsonLd data={breadcrumbs} />
            <EventsView />
        </>
    );
}
