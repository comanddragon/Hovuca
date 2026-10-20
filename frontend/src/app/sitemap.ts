import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Resolve backend API base URL for server-side sitemap generation
const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http")
  ? RAW_API_URL
  : `http://127.0.0.1:8000${RAW_API_URL}`;

interface EntitySlug {
  slug: string;
  updated_at?: string;
  published_at?: string;
  created_at?: string;
}

async function fetchDynamicSlugs(endpoint: string): Promise<EntitySlug[]> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  } catch {
    // Fail gracefully during builds or if backend is temporarily unreachable
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static marketing & public landing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/programs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/courses`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/donate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/volunteers`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/documents`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Fetch dynamic items concurrently with failure tolerance
  const [articles, programs, projects, events, courses, albums] = await Promise.all([
    fetchDynamicSlugs("/articles/?status=published&page_size=100"),
    fetchDynamicSlugs("/programs/?status=active&page_size=50"),
    fetchDynamicSlugs("/projects/?page_size=50"),
    fetchDynamicSlugs("/events/?page_size=50"),
    fetchDynamicSlugs("/courses/?page_size=50"),
    fetchDynamicSlugs("/gallery/albums/?page_size=50"),
  ]);

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((a) => a.slug)
    .map((a) => ({
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : a.published_at ? new Date(a.published_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const programRoutes: MetadataRoute.Sitemap = programs
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/programs/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  const eventRoutes: MetadataRoute.Sitemap = events
    .filter((e) => e.slug)
    .map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e.updated_at ? new Date(e.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  const courseRoutes: MetadataRoute.Sitemap = courses
    .filter((c) => c.slug)
    .map((c) => ({
      url: `${SITE_URL}/courses/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const albumRoutes: MetadataRoute.Sitemap = albums
    .filter((g) => g.slug)
    .map((g) => ({
      url: `${SITE_URL}/gallery/${g.slug}`,
      lastModified: g.updated_at ? new Date(g.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...programRoutes,
    ...projectRoutes,
    ...eventRoutes,
    ...courseRoutes,
    ...albumRoutes,
  ];
}
