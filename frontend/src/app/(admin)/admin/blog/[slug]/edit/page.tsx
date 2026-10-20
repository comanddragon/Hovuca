"use client";

import { useParams } from "next/navigation";
import { useArticle } from "@/hooks";
import { SectionHeader, PageLoader, EmptyState } from "@/components/shared";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";
import { Newspaper } from "lucide-react";

export default function EditArticlePage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: article, isLoading } = useArticle(slug);

    if (isLoading) return <PageLoader />;
    if (!article) return <EmptyState icon={<Newspaper className="h-12 w-12" />} title="Article not found" />;

    return (
        <div className="space-y-6">
            <SectionHeader title="Edit Article" description={article.title} />
            <ArticleEditorForm article={article} />
        </div>
    );
}
