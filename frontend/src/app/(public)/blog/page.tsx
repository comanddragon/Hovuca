"use client";

import { useState, useEffect } from "react";
import { useArticles, useCategories } from "@/hooks";
import { PageLoader, EmptyState, Pagination } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import { formatDate, getAvatarUrl, getInitials } from "@/lib/utils";
import { Search, Clock, Heart, MessageSquare, Newspaper, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

const PAGE_SIZE = 6;

export default function BlogPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);
    const [categorySlug, setCategorySlug] = useState("");
    const [page, setPage] = useState(1);

    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "25%"]);
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data, isLoading, isFetching } = useArticles({ search: debouncedSearch, category: categorySlug, page_size: PAGE_SIZE, page});
    const { data: categories = [] } = useCategories();

    const articles = data?.results ?? [];
    const totalPages = data?.count ? Math.ceil(data.count / PAGE_SIZE) : 1;

    if (isLoading && !data) return <PageLoader />;

    return (
        <div className="min-h-screen pb-32 bg-background">

            {isFetching && (
                <div className="fixed top-0 left-0 right-0 h-0.5 bg-primary/30 z-50">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8 }}
                    />
                </div>
            )}
            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-neutral-950">

                <motion.div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80')",
                        y: heroY,
                        opacity: 0.18,
                    }}
                />

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(123,82,171,0.75)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-transparent to-neutral-950/80" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <motion.div
                    className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white"
                    style={{ opacity: heroOpacity }}
                >
                    <motion.p
                        className="mb-6 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-white/40"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className="block w-6 h-px bg-primary/60" />
                        Hovuca Stories
                        <span className="block w-6 h-px bg-primary/60" />
                    </motion.p>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-6"
                        style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Stories &{" "}
                        <motion.span
                            className="block italic text-amber-200 font-extralight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.9 }}
                        >
                            Insights
                        </motion.span>
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-lg text-base text-white/50 font-light leading-relaxed mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                    >
                        Field stories, news, and knowledge from our teams working across communities in Cameroon.
                    </motion.p>

                    <motion.div
                        className="mx-auto max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <input
                                placeholder="Search articles…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full rounded-sm border border-white/15 bg-white/8 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">Scroll</span>
                    <motion.div
                        className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent"
                        style={{ originY: 0 }}
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </section>

            {/* ── CONTENT ───────────────────────────────────────────────── */}
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">

                {/* Category filters */}
                <motion.div
                    className="mb-10 flex flex-wrap gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: false }}
                >
                    <Button
                        size="sm"
                        variant={categorySlug === "" ? "default" : "outline"}
                        onClick={() => { setCategorySlug(""); setPage(1); }}
                        className="rounded-full text-xs px-4"
                    >
                        All
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.slug}
                            size="sm"
                            variant={categorySlug === cat.slug ? "default" : "outline"}
                            onClick={() => { setCategorySlug(cat.slug); setPage(1); }}
                            className="rounded-full text-xs px-4"
                            style={categorySlug === cat.slug ? {} : { borderColor: cat.color, color: cat.color }}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </motion.div>
            </div> {/* ← close the existing max-w-4xl div after category filters */}

            {/* Articles list — full-width, outside the content container */}
            {articles.length === 0 ? (
                <EmptyState
                    icon={<Newspaper className="h-12 w-12" />}
                    title="No articles found"
                    description="Try different search terms or categories."
                />
            ) : (
                <>
                    <div className="mx-auto max-w-7xl flex flex-col">
                        {articles.map((article, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.06 }}
                                    viewport={{ once: false, margin: "-60px" }}
                                    className="border-t border-border last:border-b"
                                >
                                    <Link
                                        href={`/blog/${article.slug}`}
                                        className={`group flex flex-col ${isEven ? "sm:flex-row" : "sm:flex-row-reverse"} min-h-[420px] transition-all duration-300`}
                                    >
                                        {/* Text side — constrained width, aligned to page margin */}
                                        {/*    <div className={`flex flex-1 flex-col justify-center py-14 ${isEven ? "pl-[max(1.5rem,calc((100vw-80rem)/2))] pr-12" : "pr-[max(1.5rem,calc((100vw-80rem)/2))] pl-12"}`}>*/}
                                                <div className={`flex flex-1 flex-col justify-center py-14 ${isEven ? "pl-[max(1.5rem,calc((100vw-120rem)/2))] pr-20" : "pr-[max(1.5rem,calc((100vw-120rem)/2))] pl-20"}`}>
                                                {/* Category + meta row */}
                                            <div className="mb-5 flex items-center gap-3">
                                                {article.category && (
                                                    <span
                                                        className="text-[10px] uppercase tracking-[0.2em] font-medium"
                                                        style={{ color: article.category.color }}
                                                    >
                                                {article.category.name}
                                            </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                                            {formatDate(article.published_at)}
                                        </span>
                                                {article.is_featured && (
                                                    <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                                Featured
                                            </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h2 className="font-display text-3xl sm:text-4xl font-light leading-[1.1] tracking-tight text-foreground mb-5 group-hover:text-primary transition-colors duration-300 max-w-sm">
                                                {article.title}
                                            </h2>

                                            {/* Excerpt */}
                                            <p className="text-sm text-muted-foreground font-light leading-relaxed line-clamp-3 mb-8 max-w-sm">
                                                {article.excerpt || article.body?.slice(0, 180)}
                                            </p>

                                            {/* Author + read more row */}
                                            <div className="flex items-center justify-between max-w-sm">
                                                <div className="flex items-center gap-2.5">
                                                    {article.author && (
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarImage src={getAvatarUrl(article.author.avatar) ?? undefined} />
                                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                {getInitials(article.author.full_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div>
                                                        {article.author && (
                                                            <p className="text-xs font-medium text-foreground leading-none mb-0.5">
                                                                {article.author.full_name}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />{article.reading_time_minutes}m
                                                    </span>
                                                            <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />{article.like_count}
                                                    </span>
                                                            <span className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />{article.comment_count}
                                                    </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="flex items-center gap-1.5 text-xs font-light text-muted-foreground group-hover:text-primary group-hover:gap-2.5 transition-all duration-300">
                                            Learn more <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                            </div>
                                        </div>

                                        {/* Image side — true full bleed to screen edge */}
                                        <div className="relative w-full sm:w-1/2 shrink-0 h-72 sm:h-auto overflow-hidden bg-muted">
                                            {article.cover_image ? (
                                                <Image
                                                    src={article.cover_image}
                                                    alt={article.cover_image_alt || article.title}
                                                    fill
                                                    sizes="50vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                                    <Newspaper className="h-10 w-10 text-primary/20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mx-auto max-w-4xl px-4 sm:px-6">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            className="mt-12"
                        />
                    </div>
                </>
            )}

            </div>
    );
}