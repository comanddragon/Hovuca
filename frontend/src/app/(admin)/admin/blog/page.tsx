"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdminArticles, useCategories } from "@/hooks";
import { SectionHeader, StatusBadge, PageLoader, EmptyState, Pagination } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { ArticleStatus } from "@/types";
import { Search, Newspaper, Plus, Pencil, Eye } from "lucide-react";

const STATUSES: ArticleStatus[] = ["draft", "review", "published", "archived"];
const PAGE_SIZE = 20;

export default function AdminBlogPage() {
    const { user } = useAuthStore();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useAdminArticles({
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category }),
        page,
        page_size: PAGE_SIZE,
    });
    const { data: categories } = useCategories();

    const { totalPages } = usePagination(data?.count, PAGE_SIZE, page);
    const articles = data?.results ?? [];

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Articles"
                description={`${data?.count ?? 0} total articles`}
                action={
                    <Button asChild>
                        <Link href="/admin/blog/new">
                            <Plus className="h-4 w-4" />
                            New Article
                        </Link>
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or excerpt…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9"
                    />
                </div>

                <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories?.map((c) => (
                            <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <PageLoader />
            ) : articles.length === 0 ? (
                <EmptyState
                    icon={<Newspaper className="h-12 w-12" />}
                    title="No articles found"
                    description="Try adjusting your search or filters."
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Title</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">Author</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">Updated</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {articles.map((a) => {
                                const canEdit = user?.role === "admin" || a.author?.id === user?.id;
                                return (
                                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {a.cover_image ? (
                                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                                        <Image
                                                            src={a.cover_image}
                                                            alt={a.cover_image_alt || a.title}
                                                            fill
                                                            sizes="40px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">{a.title}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{a.excerpt}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                                            {a.category?.name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                                            {a.author?.full_name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                                            {formatDate(a.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {a.status === "published" && (
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/blog/${a.slug}`} target="_blank">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {canEdit && (
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/admin/blog/${a.slug}/edit`}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline ml-1.5">Edit</span>
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="border-t border-border px-4 py-3">
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </div>
            )}
        </div>
    );
}
