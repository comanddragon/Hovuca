import type { Metadata } from "next";
import ArticleDetailView from "@/components/blog/ArticleDetailView";
import { constructMetadata, getArticleSchema, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchArticle(slug: string) {
  try {
    const res = await fetch(`${API_URL}/articles/${slug}/`, {
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
  const article = await fetchArticle(slug);

  if (article) {
    return constructMetadata({
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      path: `/blog/${slug}`,
      image: article.cover_image,
      imageAlt: article.cover_image_alt || article.title,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at || article.published_at,
      authors: article.author?.full_name ? [article.author.full_name] : ["HOVUCA"],
      keywords: article.tags?.map((t: { name: string }) => t.name) || [],
    });
  }

  return constructMetadata({
    title: "Field Story",
    description:
      "Read field stories, updates, and dispatches from HOVUCA's work with children and communities in Cameroon.",
    path: `/blog/${slug}`,
    type: "article",
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Field Stories", path: "/blog" },
    { name: article?.title || "Story", path: `/blog/${slug}` },
  ]);

  const articleSchema = article
    ? getArticleSchema({
        title: article.title,
        description: article.excerpt || article.meta_description,
        url: `/blog/${slug}`,
        image: article.cover_image,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        authorName: article.author?.full_name,
      })
    : null;

  return (
    <>
      <JsonLd data={breadcrumbs} />
      {articleSchema && <JsonLd data={articleSchema} />}
      <ArticleDetailView />
    </>
  );
}
