import type { Metadata } from "next";
import { EventDetailView } from "@/components/events/EventDetailView";
import { constructMetadata, getBreadcrumbSchema, getEventSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchEvent(slug: string) {
  try {
    const res = await fetch(`${API_URL}/events/${slug}/`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (event) {
    return constructMetadata({
      title: event.meta_title || event.title,
      description: event.meta_description || event.excerpt || "Join HOVUCA's community event in Cameroon.",
      path: `/events/${slug}`,
      image: event.cover_image,
      imageAlt: event.cover_image_alt || event.title,
      publishedTime: event.created_at,
      modifiedTime: event.updated_at,
      keywords: [
        "HOVUCA event",
        event.title,
        event.location_name || "Cameroon",
        event.event_type,
        "community workshop",
      ],
    });
  }

  return constructMetadata({
    title: "Event Details",
    description: "Learn about HOVUCA's upcoming workshops, forums, and community events in Cameroon.",
    path: `/events/${slug}`,
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event?.title || "Event", path: `/events/${slug}` },
  ]);

  const eventSchema = event
    ? getEventSchema({
        name: event.title,
        description: event.excerpt || event.description,
        url: `/events/${slug}`,
        startDate: event.start_date,
        endDate: event.end_date,
        locationName: event.location_name,
        locationAddress: event.location_address,
        onlineUrl: event.online_url,
        isOnline: event.event_type === "online",
        image: event.cover_image,
      })
    : null;

  return (
    <>
      <JsonLd data={breadcrumbs} />
      {eventSchema && <JsonLd data={eventSchema} />}
      <EventDetailView />
    </>
  );
}
