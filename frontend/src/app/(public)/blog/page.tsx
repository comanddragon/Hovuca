"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useArticle, useComments, useAddComment, useLikeArticle, useBookmarkArticle } from "@/hooks";
import { PageLoader } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, getAvatarUrl, getInitials, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Clock, Eye, Heart, MessageSquare, ArrowLeft, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useArticleStore, useArticleInteraction } from "@/store/article.store";

// ─── Smart renderer: HTML body OR plain-text/Markdown ────────────────────────
function ArticleBody({ content }: { content: string }) {
    const isHtml = /<\s*[a-z][\s\S]*?>/i.test(content.trim());

    if (isHtml) {
        return (
            <div
                className="
                    article-content
                    prose prose-neutral dark:prose-invert max-w-none
                    prose-headings:font-display prose-headings:font-light prose-headings:tracking-tight
                    prose-h1:text-4xl prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                    prose-p:leading-[1.85] prose-p:text-foreground/85 prose-p:font-light
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:font-light prose-blockquote:italic prose-blockquote:text-lg
                    prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-li:font-light
                    prose-img:rounded-2xl prose-img:shadow-lg
                    prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
                    prose-pre:bg-muted prose-pre:rounded-2xl prose-pre:border prose-pre:border-border
                "
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div className="article-content prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-light prose-p:leading-[1.85] prose-p:font-light prose-p:text-foreground/85">
            {content.split("\n").map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                if (line.startsWith("# "))   return <h1 key={i}>{line.slice(2)}</h1>;
                if (line.startsWith("## "))  return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i}>{line.slice(2)}</li>;
                if (line.startsWith("> "))   return <blockquote key={i}><p>{line.slice(2)}</p></blockquote>;
                return <p key={i}>{line}</p>;
            })}
        </div>
    );
}

export default function ArticlePage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: article, isLoading } = useArticle(slug);
    const { data: comments = [] } = useComments(article?.id ?? "");
    const { mutate: like } = useLikeArticle();
    const { mutate: bookmark } = useBookmarkArticle();
    const { mutate: addComment, isPending: commenting } = useAddComment(article?.id ?? "");
    const { isAuthenticated } = useAuthStore();
    const [commentBody, setCommentBody] = useState("");

    // ── Sync store from server data ───────────────────────────────────────────
    // Runs whenever article loads or like_count changes (after confirmLike
    // the query is NOT invalidated for likes, so this only runs on initial
    // load and on bookmark-triggered refetches).
    const { syncFromServer, clearArticle } = useArticleStore();

    useEffect(() => {
        if (!article) return;
        syncFromServer(
            article.slug,
            article.is_liked,       // ✅ real value from API
            article.is_bookmarked,  // ✅ real value from API
            article.like_count,
        );
    }, [article?.slug, article?.is_liked, article?.is_bookmarked, article?.like_count]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => { if (slug) clearArticle(slug); };
    }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

    // Read from store — reflects optimistic updates immediately
    const { liked, bookmarked, likeCount } = useArticleInteraction(slug);

    // ── Reading progress (drives the sidebar ring) ────────────────────────────
    const contentRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const el = contentRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const total = rect.height - window.innerHeight * 0.6;
            const scrolled = Math.min(Math.max(-rect.top, 0), total);
            setProgress(total > 0 ? (scrolled / total) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [article?.slug]);

    if (isLoading) return <PageLoader />;
    if (!article) return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-muted-foreground font-light">Article not found.</p>
        </div>
    );

    const handleComment = () => {
        if (!commentBody.trim()) return;
        addComment({ body: commentBody }, { onSuccess: () => setCommentBody("") });
    };

    const handleLike = () => {
        if (!isAuthenticated) return;
        like(article.slug);
    };

    const handleBookmark = () => {
        if (!isAuthenticated) return;
        bookmark(article.slug);
    };

    return (
        <div className="min-h-screen bg-background">

            {/* ── HERO / COVER ──────────────────────────────────────────── */}
            <div className="relative w-full h-[55vh] min-h-[420px] overflow-hidden bg-neutral-950">
                {article.cover_image ? (
                    <Image
                        src={article.cover_image}
                        alt={article.cover_image_alt || article.title}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover opacity-50"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-neutral-900 to-neutral-950" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />

                <motion.div
                    className="absolute top-6 left-6 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link href="/blog">
                        <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Blog
                        </Button>
                    </Link>
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 w-full max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {article.category && (
                                <span
                                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                                    style={{ backgroundColor: article.category.color }}
                                >
                                    {article.category.name}
                                </span>
                            )}
                            {article.tags?.map((tag) => (
                                <span key={tag.id} className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] text-white/60">
                                    #{tag.name}
                                </span>
                            ))}
                            {article.is_featured && (
                                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                                    Featured
                                </span>
                            )}
                        </div>
                        <h1 className="font-display text-3xl md:text-5xl font-light text-white leading-tight tracking-tight">
                            {article.title}
                        </h1>
                    </motion.div>
                </div>
            </div>

            {/* ── CONTENT ───────────────────────────────────────────────── */}
            <div className="mx-auto max-w-5xl px-6 py-12 lg:flex lg:items-start lg:gap-12">

                {/* ── SIDEBAR (desktop) ────────────────────────────────── */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-28 space-y-6">
                        {article.author && (
                            <div className="flex items-center gap-3">
                                <div className="relative h-14 w-14 shrink-0">
                                    <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                                        <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="3" />
                                        <circle
                                            cx="28" cy="28" r="24" fill="none" stroke="var(--primary)" strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 24}
                                            strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                                            className="transition-[stroke-dashoffset] duration-150 ease-linear"
                                        />
                                    </svg>
                                    <Avatar className="absolute inset-0 m-auto h-9 w-9 ring-2 ring-background">
                                        <AvatarImage src={getAvatarUrl(article.author.avatar) ?? undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {getInitials(article.author.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm text-foreground leading-none truncate">
                                        {article.author.full_name}
                                    </p>
                                    {article.published_at && (
                                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(article.published_at)}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Reading time</span>
                                <span>{article.reading_time_minutes} min</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Views</span>
                                <span>{article.view_count.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Comments</span>
                                <span>{article.comment_count}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-t border-border pt-4">
                            <Button
                                variant={liked ? "default" : "outline"}
                                size="sm"
                                onClick={handleLike}
                                className="gap-1.5 rounded-full flex-1"
                                disabled={!isAuthenticated}
                            >
                                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                                {likeCount}
                            </Button>
                            <Button
                                variant={bookmarked ? "default" : "outline"}
                                size="icon"
                                onClick={handleBookmark}
                                className="rounded-full shrink-0"
                                disabled={!isAuthenticated}
                            >
                                {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full shrink-0"
                                onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
                            >
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {article.tags && article.tags.length > 0 && (
                            <div className="border-t border-border pt-4">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Filed under
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {article.tags.map((tag) => (
                                        <span key={tag.id} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── ARTICLE COLUMN ───────────────────────────────────── */}
                <div ref={contentRef} className="min-w-0 flex-1 max-w-2xl">

                    {/* Author + meta (mobile only — sidebar covers this on desktop) */}
                    <div className="mb-10 flex flex-wrap items-center gap-4 text-sm text-muted-foreground lg:hidden">
                        {article.author && (
                            <div className="flex items-center gap-2.5">
                                <Avatar className="h-9 w-9 ring-2 ring-border">
                                    <AvatarImage src={getAvatarUrl(article.author.avatar) ?? undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                        {getInitials(article.author.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-foreground leading-none">{article.author.full_name}</p>
                                    {article.published_at && (
                                        <p className="mt-0.5 text-xs">{formatDate(article.published_at)}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-4 ml-auto flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {article.reading_time_minutes} min read
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                {article.view_count.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {article.comment_count} comments
                            </span>
                        </div>
                    </div>

                    {article.excerpt && (
                        <motion.p
                            className="mt-8 font-display text-2xl italic text-muted-foreground font-light leading-relaxed border-l-2 border-primary/40 pl-5 lg:mt-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            {article.excerpt}
                        </motion.p>
                    )}

                    <motion.div
                        className="mt-10 mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <ArticleBody content={article.body} />
                    </motion.div>

                    {/* ── ACTIONS BAR (mobile only) ────────────────────── */}
                    <div className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-border bg-muted/30 px-6 py-4 mb-16 lg:hidden">
                        <div className="flex items-center gap-3">
                            <Button
                                variant={liked ? "default" : "outline"}
                                size="sm"
                                onClick={handleLike}
                                className="gap-2 rounded-full"
                                disabled={!isAuthenticated}
                            >
                                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                                {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                            </Button>
                            <Button
                                variant={bookmarked ? "default" : "outline"}
                                size="sm"
                                onClick={handleBookmark}
                                className="gap-2 rounded-full"
                                disabled={!isAuthenticated}
                            >
                                {bookmarked
                                    ? <BookmarkCheck className="h-4 w-4" />
                                    : <Bookmark className="h-4 w-4" />
                                }
                                {bookmarked ? "Saved" : "Save"}
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-muted-foreground"
                            onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>

                    {/* ── COMMENTS ──────────────────────────────────────────── */}
                    <section className="pb-24">
                        <h2 className="mb-8 font-display text-2xl font-light text-foreground flex items-center gap-2 tracking-tight">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            {article.comment_count} Comments
                        </h2>

                        {isAuthenticated ? (
                            <motion.div
                                className="mb-10 rounded-2xl border border-border bg-card p-5 space-y-3"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-sm font-medium text-foreground">Leave a comment</p>
                                <Textarea
                                    placeholder="Share your thoughts…"
                                    value={commentBody}
                                    onChange={(e) => setCommentBody(e.target.value)}
                                    rows={3}
                                    className="resize-none bg-background"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleComment}
                                        disabled={commenting || !commentBody.trim()}
                                        size="sm"
                                        className="rounded-full px-6"
                                    >
                                        {commenting ? "Posting…" : "Post comment"}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="mb-10 rounded-2xl border border-dashed border-border p-6 text-center">
                                <p className="text-sm text-muted-foreground mb-3 font-light">
                                    Sign in to join the conversation
                                </p>
                                <Button size="sm" asChild className="rounded-full px-6">
                                    <Link href="/login">Sign in</Link>
                                </Button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground font-light py-8">
                                    No comments yet. Be the first to share your thoughts.
                                </p>
                            ) : (
                                comments.map((comment, index) => (
                                    <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.4 }}
                                        viewport={{ once: true }}
                                        className="flex gap-4 rounded-2xl border border-border bg-card p-5"
                                    >
                                        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border">
                                            <AvatarImage src={getAvatarUrl(comment.author?.avatar ?? null) ?? undefined} />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {comment.author ? getInitials(comment.author.full_name) : "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-foreground">
                                                {comment.author?.full_name ?? "Anonymous"}
                                            </span>
                                                <span className="text-xs text-muted-foreground">
                                                {timeAgo(comment.created_at)}
                                            </span>
                                                {comment.is_pinned && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    Pinned
                                                </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/80 leading-relaxed font-light">
                                                {comment.body}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}