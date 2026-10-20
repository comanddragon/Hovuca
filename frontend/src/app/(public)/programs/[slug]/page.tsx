import type { Metadata } from "next";
import { ProgramDetailView } from "@/components/programs/ProgramDetailView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchProgram(slug: string) {
  try {
    const res = await fetch(`${API_URL}/programs/${slug}/`, {
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
  const program = await fetchProgram(slug);

  if (program) {
    return constructMetadata({
      title: program.title,
      description: program.excerpt || program.description || "HOVUCA community program in Cameroon.",
      path: `/programs/${slug}`,
      image: program.banner,
      imageAlt: program.title,
      keywords: ["HOVUCA program", program.title, "Cameroon NGO", "community initiative"],
    });
  }

  return constructMetadata({
    title: "Program Details",
    description: "Learn about HOVUCA's community-led programs for children and youth in Cameroon.",
    path: `/programs/${slug}`,
  });
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const program = await fetchProgram(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Programs", path: "/programs" },
    { name: program?.title || "Program", path: `/programs/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <ProgramDetailView />
    </>
  );
}
