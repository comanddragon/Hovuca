import type { Metadata } from "next";
import { GalleryDetailView } from "@/components/gallery/GalleryDetailView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchAlbum(slug: string) {
  try {
    const res = await fetch(`${API_URL}/gallery/albums/${slug}/`, {
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
  const album = await fetchAlbum(slug);

  if (album) {
    const cover = album.effective_cover || album.cover_image;
    return constructMetadata({
      title: album.title,
      description: album.description || `Photo gallery for ${album.title} by HOVUCA.`,
      path: `/gallery/${slug}`,
      image: cover,
      imageAlt: album.title,
      keywords: ["HOVUCA gallery", album.title, "Cameroon photos", "community album"],
    });
  }

  return constructMetadata({
    title: "Gallery Album",
    description: "Explore photos and moments from HOVUCA's community work in Cameroon.",
    path: `/gallery/${slug}`,
  });
}

export default async function GalleryAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const album = await fetchAlbum(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
    { name: album?.title || "Album", path: `/gallery/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <GalleryDetailView />
    </>
  );
}
