"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, Eye, Heart, MessageSquare, Share2 } from "lucide-react";

import { useAddComment, useArticle, useBookmarkArticle, useComments, useLikeArticle } from "@/hooks";
import { formatDate, getAvatarUrl, getInitials, timeAgo } from "@/lib/utils";
import { useArticleInteraction, useArticleStore } from "@/store/article.store";
import { useAuthStore } from "@/store/auth.store";
import { PageLoader } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authPath } from "@/lib/auth-return";

function resolveArticleMedia(content: string) {
    const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || "https://media.hovuca.org").replace(/\/$/, "");
    const resolved = mediaBase
        ? content
            // Current Django media paths.
            .replace(
                /\b(src|href)=(['"])\/media\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/`,
            )
            // Paths retained by articles imported from the former WordPress site.
            .replace(
                /\b(src|href)=(['"])\/?hovuca\.org\/wp-content\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/hovuca.org/wp-content/`,
            )
            // URLs generated while the private R2 S3 endpoint was mistakenly used
            // as a public media host. The bucket segment is not part of custom-domain URLs.
            .replace(
                /\b(src|href)=(['"])https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/media\//gi,
                (_match, attribute: string, quote: string) => `${attribute}=${quote}${mediaBase}/`,
            )
        : content;

    // Archived WordPress articles often wrapped images in links to the original
    // attachment. Published inline images should display as content, not links.
    return resolved.replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, "$1");
}

function ArticleBody({ content }: { content: string }) {
    const isHtml = /<\s*[a-z][\s\S]*?>/i.test(content.trim());
    const proseClass = "rich-content prose prose-neutral max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-3xl prose-p:text-[1.0625rem] prose-p:leading-8 prose-p:text-neutral-700 prose-a:text-[#5d2d84] prose-a:font-semibold prose-blockquote:border-l-[#5d2d84] prose-blockquote:text-neutral-600 prose-img:rounded-xl";

    if (isHtml) {
        return <div className={proseClass} dangerouslySetInnerHTML={{ __html: resolveArticleMedia(content) }} />;
    }

    return (
        <div className={proseClass}>
            {content.split("\n").map((line, index) => {
                if (!line.trim()) return <br key={index} />;
                if (line.startsWith("# ")) return <h1 key={index}>{line.slice(2)}</h1>;
                if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
                if (line.startsWith("- ") || line.startsWith("* ")) return <li key={index}>{line.slice(2)}</li>;
                if (line.startsWith("> ")) return <blockquote key={index}><p>{line.slice(2)}</p></blockquote>;
                return <p key={index}>{line}</p>;
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
    const { syncFromServer, clearArticle } = useArticleStore();
    const { liked, bookmarked, likeCount } = useArticleInteraction(slug);
    const [commentBody, setCommentBody] = useState("");

    useEffect(() => {
        if (!article) return;
        syncFromServer(article.slug, article.is_liked, article.is_bookmarked, article.like_count);
    }, [article, syncFromServer]);

    useEffect(() => () => {
        if (slug) clearArticle(slug);
    }, [clearArticle, slug]);

    if (isLoading) return <PageLoader />;
    if (!article) {
        return <div className="flex min-h-[60vh] items-center justify-center text-neutral-500">Article not found.</div>;
    }

    const submitComment = () => {
        if (!commentBody.trim()) return;
        addComment({ body: commentBody }, { onSuccess: () => setCommentBody("") });
    };

    return (
        <main className="min-h-screen bg-[#fbfaf8] text-neutral-900">
            <article>
                <header className="mx-auto max-w-5xl px-6 pb-10 pt-12 sm:pt-16">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-[#35145f]">
                        <ArrowLeft className="h-4 w-4" /> Back to stories
                    </Link>

                    <div className="mt-10 max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                            {article.category && <span className="font-bold uppercase tracking-[0.14em] text-[#5d2d84]">{article.category.name}</span>}
                            {article.published_at && <><span aria-hidden="true">/</span><span>{formatDate(article.published_at)}</span></>}
                            <span aria-hidden="true">/</span>
                            <span>{article.reading_time_minutes} min read</span>
                        </div>
                        <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">{article.title}</h1>
                        {article.excerpt && <p className="mt-6 max-w-3xl text-xl leading-8 text-neutral-600">{article.excerpt}</p>}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-neutral-200 pt-6">
                        {article.author ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={getAvatarUrl(article.author.avatar) ?? undefined} />
                                    <AvatarFallback className="bg-[#eee7f3] text-xs font-bold text-[#35145f]">{getInitials(article.author.full_name)}</AvatarFallback>
                                </Avatar>
                                <div><p className="text-sm font-bold">{article.author.full_name}</p><p className="text-xs text-neutral-500">HOVUCA</p></div>
                            </div>
                        ) : <span />}
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{article.view_count.toLocaleString()}</span>
                            <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />{article.comment_count}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{article.reading_time_minutes}m</span>
                        </div>
                    </div>
                </header>

                {article.cover_image && (
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="relative aspect-[16/8] overflow-hidden rounded-xl bg-neutral-200">
                            <Image src={article.cover_image} alt={article.cover_image_alt || article.title} fill priority loading="eager" sizes="(max-width: 1200px) 100vw, 1152px" className="object-cover" />
                        </div>
                    </div>
                )}

                <div className="mx-auto max-w-3xl px-6 pb-20 pt-12 sm:pt-16">
                    <ArticleBody content={article.body} />

                    {article.tags?.length > 0 && (
                        <div className="mt-12 flex flex-wrap gap-2 border-t border-neutral-200 pt-7">
                            {article.tags.map((tag) => <span key={tag.id} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600">#{tag.name}</span>)}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="flex gap-2">
                            <Button variant={liked ? "default" : "outline"} size="sm" onClick={() => isAuthenticated && like(article.slug)} disabled={!isAuthenticated} className={liked ? "bg-[#35145f] hover:bg-[#4d2477]" : ""}>
                                <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />{likeCount}
                            </Button>
                            <Button variant={bookmarked ? "default" : "outline"} size="sm" onClick={() => isAuthenticated && bookmark(article.slug)} disabled={!isAuthenticated} className={bookmarked ? "bg-[#35145f] hover:bg-[#4d2477]" : ""}>
                                {bookmarked ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}{bookmarked ? "Saved" : "Save"}
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}><Share2 className="mr-2 h-4 w-4" />Share</Button>
                    </div>

                    <section className="mt-16 border-t border-neutral-200 pt-12">
                        <h2 className="font-display text-3xl font-extrabold tracking-tight">Conversation</h2>
                        <p className="mt-2 text-sm text-neutral-500">{article.comment_count} {article.comment_count === 1 ? "comment" : "comments"}</p>

                        {isAuthenticated ? (
                            <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5">
                                <Textarea placeholder="Share your thoughts" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={4} className="resize-none border-neutral-200 bg-[#fbfaf8]" />
                                <div className="mt-3 flex justify-end"><Button onClick={submitComment} disabled={commenting || !commentBody.trim()} className="bg-[#35145f] hover:bg-[#4d2477]">{commenting ? "Posting..." : "Post comment"}</Button></div>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">Want to join the conversation? <Link href={authPath("/login", `/blog/${slug}`)} className="font-bold text-[#5d2d84] hover:underline">Sign in</Link></div>
                        )}

                        <div className="mt-8 space-y-4">
                            {comments.length === 0 ? <p className="py-6 text-sm text-neutral-500">No comments yet.</p> : comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5">
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={getAvatarUrl(comment.author?.avatar ?? null) ?? undefined} />
                                        <AvatarFallback className="bg-[#eee7f3] text-xs font-bold text-[#35145f]">{comment.author ? getInitials(comment.author.full_name) : "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{comment.author?.full_name ?? "Anonymous"}</span><span className="text-xs text-neutral-500">{timeAgo(comment.created_at)}</span>{comment.is_pinned && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold">Pinned</span>}</div>
                                        <p className="mt-2 text-sm leading-7 text-neutral-700">{comment.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </article>
        </main>
    );
}
