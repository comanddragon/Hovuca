import type { Metadata } from "next";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchProject(slug: string) {
  try {
    const res = await fetch(`${API_URL}/projects/${slug}/`, {
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
  const project = await fetchProject(slug);

  if (project) {
    return constructMetadata({
      title: project.title,
      description: project.excerpt || project.description || "HOVUCA grassroots community project in Cameroon.",
      path: `/projects/${slug}`,
      image: project.cover_image,
      imageAlt: project.cover_image_alt || project.title,
      keywords: ["HOVUCA project", project.title, "Cameroon grassroots development", "community action"],
    });
  }

  return constructMetadata({
    title: "Project Details",
    description: "Learn about HOVUCA's grassroots community projects in Cameroon.",
    path: `/projects/${slug}`,
  });
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: project?.title || "Project", path: `/projects/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <ProjectDetailView />
    </>
  );
}
