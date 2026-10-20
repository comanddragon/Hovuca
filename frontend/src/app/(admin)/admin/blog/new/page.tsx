"use client";

import { SectionHeader } from "@/components/shared";
import { ArticleEditorForm } from "@/components/admin/ArticleEditorForm";

export default function NewArticlePage() {
    return (
        <div className="space-y-6">
            <SectionHeader title="New Article" description="Draft a new blog article." />
            <ArticleEditorForm />
        </div>
    );
}
