"use client";

import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    BookOpenText,
    CheckCircle2,
    Clock3,
    Eye,
    FilePenLine,
    Plus,
} from "lucide-react";

import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAdminArticles } from "@/hooks";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

function Metric({ label, value, description }: { label: string; value: number; description: string }) {
    return (
        <div className="border-t border-border py-5 first:border-t-0 sm:border-l sm:border-t-0 sm:px-6 sm:first:border-l-0 sm:first:pl-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-foreground">{value}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
    );
}

export default function AdminHomePage() {
    const { user } = useAuthStore();
    const recent = useAdminArticles({ page: 1, page_size: 6 });
    const drafts = useAdminArticles({ status: "draft", page: 1, page_size: 1 });
    const reviews = useAdminArticles({ status: "review", page: 1, page_size: 1 });
    const published = useAdminArticles({ status: "published", page: 1, page_size: 1 });

    const isLoading = recent.isLoading || drafts.isLoading || reviews.isLoading || published.isLoading;
    const articles = recent.data?.results ?? [];
    const firstName = user?.full_name?.split(" ")[0] || "there";

    return (
        <div className="space-y-8 pb-10">
            <section className="overflow-hidden border border-border bg-primary text-white">
                <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:py-9">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Welcome back, {firstName}.</h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-brand-mint-light sm:text-base">
                            Shape HOVUCA&apos;s public story, prepare work for review, and keep published content current.
                        </p>
                    </div>
                    <Button asChild className="h-11 bg-brand-coral px-5 text-white hover:bg-brand-coral-dark focus-visible:ring-brand-gold">
                        <Link href="/admin/blog/new">
                            <Plus className="h-4 w-4" />
                            Write an article
                        </Link>
                    </Button>
                </div>
            </section>

            <section aria-labelledby="content-overview">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                    <div>
                        <h2 id="content-overview" className="text-xl font-semibold tracking-tight text-foreground">Content overview</h2>
                        <p className="mt-1 text-sm text-muted-foreground">A live view of the editorial pipeline.</p>
                    </div>
                    <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                        Manage all articles <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="All articles" value={recent.data?.count ?? 0} description="Across every publishing state" />
                    <Metric label="Drafts" value={drafts.data?.count ?? 0} description="Still being written" />
                    <Metric label="In review" value={reviews.data?.count ?? 0} description="Waiting for an editorial decision" />
                    <Metric label="Published" value={published.data?.count ?? 0} description="Visible to public readers" />
                </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,.7fr)]">
                <section aria-labelledby="recent-work">
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <h2 id="recent-work" className="text-xl font-semibold tracking-tight text-foreground">Recent work</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Continue from the latest articles in the newsroom.</p>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-border bg-card">
                        {isLoading ? (
                            <div className="divide-y divide-border" aria-label="Loading recent articles">
                                {[0, 1, 2, 3].map((item) => (
                                    <div key={item} className="flex animate-pulse items-center gap-4 px-5 py-4">
                                        <div className="h-9 w-9 bg-muted" />
                                        <div className="flex-1 space-y-2"><div className="h-3 w-2/3 bg-muted" /><div className="h-2.5 w-1/3 bg-muted" /></div>
                                    </div>
                                ))}
                            </div>
                        ) : articles.length ? (
                            <ul className="divide-y divide-border">
                                {articles.map((article) => {
                                    const canEdit = user?.role === "admin" || user?.role === "staff" || article.author?.id === user?.id;
                                    return (
                                        <li key={article.id} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                            <div className="flex min-w-0 items-start gap-3">
                                                {article.cover_image ? (
                                                    <span className="relative mt-0.5 h-11 w-14 shrink-0 overflow-hidden bg-muted">
                                                        <Image
                                                            src={article.cover_image}
                                                            alt={article.cover_image_alt || ""}
                                                            fill
                                                            sizes="56px"
                                                            className="object-cover"
                                                        />
                                                    </span>
                                                ) : (
                                                    <span className="mt-0.5 flex h-11 w-14 shrink-0 items-center justify-center bg-brand-mint-wash text-primary dark:bg-primary dark:text-brand-mint-wash">
                                                        <FilePenLine className="h-4 w-4" />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">{article.title}</p>
                                                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                                        <span>{article.author?.full_name ?? "HOVUCA team"}</span>
                                                        <span aria-hidden="true">·</span>
                                                        <span>{formatDate(article.created_at)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                <StatusBadge status={article.status} />
                                                {canEdit ? (
                                                    <Link href={`/admin/blog/${article.slug}/edit`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline">
                                                        Edit <ArrowRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                ) : article.status === "published" ? (
                                                    <Link href={`/blog/${article.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline">
                                                        View <Eye className="h-3.5 w-3.5" />
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <BookOpenText className="mx-auto h-8 w-8 text-muted-foreground" />
                                <h3 className="mt-4 text-base font-semibold text-foreground">The newsroom is ready</h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create the first article to begin building HOVUCA&apos;s public story.</p>
                                <Button asChild className="mt-5"><Link href="/admin/blog/new"><Plus className="h-4 w-4" />Create article</Link></Button>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="border-t-2 border-brand-gold bg-muted p-6 text-foreground dark:bg-brand-forest-deep dark:text-white" aria-labelledby="publishing-desk">
                    <h2 id="publishing-desk" className="text-lg font-semibold tracking-tight">Publishing desk</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-border">The clearest next actions for keeping public content moving.</p>
                    <div className="mt-6 space-y-5">
                        <Link href="/admin/blog" className="group flex gap-3">
                            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-coral" />
                            <span><strong className="block text-sm">Review pending work</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-border">{reviews.data?.count ?? 0} article{reviews.data?.count === 1 ? "" : "s"} currently awaiting review.</span></span>
                        </Link>
                        <Link href="/admin/blog" className="group flex gap-3">
                            <FilePenLine className="mt-0.5 h-5 w-5 shrink-0 text-brand-coral" />
                            <span><strong className="block text-sm">Continue drafting</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-border">Return to unfinished stories and prepare them for review.</span></span>
                        </Link>
                        <Link href="/blog" target="_blank" className="group flex gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-coral" />
                            <span><strong className="block text-sm">Check the public blog</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-border">See the published experience exactly as visitors do.</span></span>
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
