"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { useArticles, useCategories, useFeaturedArticles } from "@/hooks";
import type { Article } from "@/types";

const PAGE_SIZE = 9;

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function Cover({ article, sizes, className = "" }: { article: Article; sizes: string; className?: string }) {
    if (!article.cover_image) {
        return <div className={`absolute inset-0 flex items-center justify-center bg-[#234d44] px-6 text-center text-lg font-semibold text-white ${className}`}>{article.title}</div>;
    }
    return <Image src={article.cover_image} alt={article.cover_image_alt || article.title} fill sizes={sizes} className={`object-cover ${className}`} />;
}

function StoryMeta({ article, className = "" }: { article: Article; className?: string }) {
    return <div className={`flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-semibold text-[#53645f] ${className}`}>
        {article.category && <span>{article.category.name}</span>}
        {article.published_at && <><span aria-hidden="true">·</span><time dateTime={article.published_at}>{formatDate(article.published_at)}</time></>}
        {article.reading_time_minutes > 0 && <><span aria-hidden="true">·</span><span>{article.reading_time_minutes} min read</span></>}
    </div>;
}

function Pager({ page, totalPages, onChange, disabled }: { page: number; totalPages: number; onChange: (page: number) => void; disabled: boolean }) {
    if (totalPages <= 1) return null;
    const pages: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
        else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    const btn = "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]";
    return <nav aria-label="Story pagination" className="mt-4 flex items-center justify-center gap-2 px-6 pb-20">
        <button className={btn} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ArrowLeft className="size-4" aria-hidden="true" /></button>
        {pages.map((p, i) => p === "…"
            ? <span key={`e${i}`} className="px-1 text-sm text-[#53645f]">…</span>
            : <button key={p} className={`${btn} ${p === page ? "bg-[#183b35] text-white" : "border border-[#183b35]/30 hover:border-[#183b35]"}`} aria-current={p === page ? "page" : undefined} disabled={disabled} onClick={() => onChange(p)}>{p}</button>
        )}
        <button className={btn} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><ArrowRight className="size-4" aria-hidden="true" /></button>
    </nav>;
}

export default function StoriesDirectory() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);

    const categories = useCategories();
    const featured = useFeaturedArticles();
    const { data, isLoading, isFetching, isError, isPlaceholderData, refetch } = useArticles({ search: query, category: category || undefined, status: "published", page, page_size: PAGE_SIZE });

    const articles = data?.results ?? [];
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
    const clear = () => { setSearch(""); setQuery(""); setCategory(""); setPage(1); };

    const picks = (featured.data?.length ? featured.data : articles).slice(0, 3);

    const lead = page === 1 ? articles[0] : undefined;
    const afterLead = lead ? articles.slice(1) : articles;
    const sideRows = lead ? afterLead.slice(0, 2) : [];
    const gridRows = lead ? afterLead.slice(2) : articles;
    const gridStart = lead ? sideRows.length + 2 : 1;

    return <div className="public-site">
        {/* ─── category and search controls ───────────────────────── */}
        <form onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()); setPage(1); }}
            className="mx-auto grid max-w-[1280px] gap-4 border-b border-[#183b35]/20 px-6 py-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-end lg:gap-8">
            <label htmlFor="story-category" className="block min-w-0">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#53645f]">Browse by topic</span>
                <select id="story-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}
                    className="h-12 w-full rounded-xl border border-[#183b35]/25 bg-white px-4 pr-10 text-sm font-semibold text-[#183b35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d85c43]">
                    <option value="">All stories</option>
                    {categories.data?.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
                </select>
            </label>
            <div className="min-w-0">
                <label htmlFor="story-search" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#53645f]">Search stories</label>
                <div className="flex min-w-0 gap-2">
                    <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#183b35]/25 px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#d85c43]">
                        <Search aria-hidden="true" className="size-4 shrink-0 text-[#53645f]" />
                        <input id="story-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Keyword or phrase" className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#53645f]/70" />
                    </div>
                    <button type="submit" className="h-12 shrink-0 rounded-full bg-[#183b35] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2d5a50] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d85c43]">Search</button>
                </div>
            </div>
            {(query || category) && <button type="button" onClick={clear} className="justify-self-start text-sm font-semibold text-[#d85c43] underline-offset-4 hover:underline sm:col-span-2">Clear filters</button>}
        </form>

        {categories.isError && <p role="status" className="mx-auto max-w-[1280px] px-6 pt-4 text-sm text-[#53645f]">Category options could not load. You can still search stories. <button className="underline underline-offset-4" onClick={() => categories.refetch()}>Retry categories</button></p>}

        {/* ─── editor's picks ──────────────────────────────────────── */}
        {picks.length > 0 && <section className="bg-[#f7f5f0] px-6 py-16 md:py-20" aria-labelledby="picks-heading">
            <div className="mx-auto max-w-[1280px]">
                <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#46525b]"><span className="h-px w-12 bg-[#e0aa18]" aria-hidden="true" />Editor&rsquo;s picks</p>
                <h2 id="picks-heading" className="mt-4 text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-4xl">Stories worth your time.</h2>

                <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
                    <article className="group min-w-0">
                        <Link href={`/blog/${picks[0].slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#234d44] sm:aspect-[16/10]">
                                {picks[0].cover_image ? <Cover article={picks[0]} sizes="(max-width: 1024px) 100vw, 58vw" className="transition-transform duration-500 group-hover:scale-[1.03]" /> : <span className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-bold uppercase tracking-[0.22em] text-white/75">HOVUCA field stories</span>}
                            </div>
                            <div className="relative -mt-10 ml-5 rounded-tl-2xl bg-[#f7f5f0] px-6 pt-6 sm:-mt-14 sm:ml-10 sm:px-8 sm:pt-8">
                                <StoryMeta article={picks[0]} />
                                <h3 className="mt-3 max-w-xl text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-[#183b35] sm:text-3xl">{picks[0].title}</h3>
                                <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-[#53645f]">{picks[0].excerpt}</p>
                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#d85c43]">Read the story <ArrowUpRight className="size-4" aria-hidden="true" /></span>
                            </div>
                        </Link>
                    </article>
                    {picks.length > 1 && <div className="flex min-w-0 flex-col gap-8">
                        {picks.slice(1).map((story) => <article key={story.id} className="min-w-0 border-t border-[#e0aa18] pt-5">
                            <Link href={`/blog/${story.slug}`} className="group grid min-w-0 gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
                                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#234d44] sm:aspect-[4/5]">
                                    {story.cover_image ? <Cover article={story} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 35vw, 18vw" className="transition-transform duration-500 group-hover:scale-[1.04]" /> : <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Field stories</span>}
                                </div>
                                <div className="min-w-0">
                                    <StoryMeta article={story} />
                                    <h3 className="mt-3 text-xl font-bold leading-[1.2] tracking-[-0.01em] text-[#183b35] sm:text-2xl">{story.title}</h3>
                                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#53645f]">{story.excerpt}</p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#d85c43]">Read story <ArrowUpRight className="size-4" aria-hidden="true" /></span>
                                </div>
                            </Link>
                        </article>)}
                    </div>}
                </div>
            </div>
        </section>}

        {/* ─── main list ───────────────────────────────────────────── */}
        <section aria-labelledby="stories-heading" className="mx-auto max-w-[1280px] px-6 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[#183b35]/20 pb-7">
                <div>
                    <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#46525b]"><span className="h-px w-12 bg-[#e0aa18]" aria-hidden="true" />Just published</p>
                    <h2 id="stories-heading" className="mt-4 text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-4xl">Latest from the field.</h2>
                </div>
                <p aria-live="polite" className="text-sm text-[#53645f]">{isLoading ? "Loading stories…" : isFetching ? "Updating stories…" : isError ? "Stories are temporarily unavailable." : `${data?.count ?? 0} ${data?.count === 1 ? "story" : "stories"} found`}</p>
            </div>

            {isError ? (
                <div role="alert" className="border-b border-[#183b35]/20 py-12"><h3 className="text-2xl font-bold">We couldn&rsquo;t load the stories.</h3><p className="mt-3 text-[#53645f]">Please try again to see the latest articles.</p><button disabled={isFetching} className="mt-6 inline-flex min-h-12 items-center border border-[#183b35]/40 px-5 py-3 font-semibold hover:bg-[#183b35] hover:text-white disabled:opacity-40" onClick={() => refetch()}>Try again</button></div>
            ) : !isLoading && !articles.length ? (
                <div className="border-b border-[#183b35]/20 py-14"><h3 className="text-2xl font-bold">{query || category ? "No stories match these filters." : "Stories will appear here when published."}</h3>{(query || category) && <button className="mt-6 inline-flex min-h-12 items-center border border-[#183b35]/40 px-5 py-3 font-semibold hover:bg-[#183b35] hover:text-white" onClick={clear}>Show all stories</button>}</div>
            ) : <div aria-busy={isFetching}>

                {lead && <article className="grid gap-10 pt-12 pb-14 md:grid-cols-[1.15fr_0.85fr] md:gap-12">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#f2f0ea]">
                        <span className="absolute left-5 top-5 z-10 rounded-full bg-white/95 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#183b35] shadow-sm">Featured</span>
                        <Cover article={lead} sizes="(max-width: 768px) 100vw, 700px" />
                    </div>
                    <div>
                        <div className="relative -mt-16 ml-5 rounded-2xl rounded-bl-none bg-white px-7 pb-1 pt-7 md:mt-0 md:ml-0 md:rounded-none md:bg-transparent md:px-0 md:pt-6">
                            {lead.category && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d85c43]">{lead.category.name}</p>}
                            <h3 className="mt-3 text-2xl font-bold leading-[1.15] tracking-[-0.02em] sm:text-3xl"><Link href={`/blog/${lead.slug}`} className="hover:underline hover:underline-offset-4">{lead.title}</Link></h3>
                            <p className="mt-4 line-clamp-4 text-[14.5px] leading-7 text-[#5b646a]">{lead.excerpt}</p>
                            <Link href={`/blog/${lead.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#d85c43]">Read the story <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
                        </div>
                    </div>
                </article>}

                {sideRows.length > 0 && <div className="grid gap-8 border-t border-[#183b35]/10 pt-10 sm:grid-cols-2">
                    {sideRows.map((article) => (
                        <Link key={article.id} href={`/blog/${article.slug}`} className="group grid grid-cols-[0.8fr_1fr] gap-5 border-t border-[#e0aa18] pt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">
                            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f2f0ea]"><Cover article={article} sizes="(max-width: 768px) 40vw, 220px" className="transition-transform duration-500 group-hover:scale-[1.03]" /></div>
                            <div>
                                {article.category && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d85c43]">{article.category.name}</p>}
                                <h4 className="mt-2 text-lg font-bold leading-[1.25] tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">{article.title}</h4>
                                <StoryMeta article={article} className="mt-2" />
                            </div>
                        </Link>
                    ))}
                </div>}

                {gridRows.length > 0 && <div className="mt-10 grid gap-x-10 gap-y-10 border-t border-[#183b35]/20 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                    {gridRows.map((article, index) => (
                        <article key={article.id} className="border-t border-[#e0aa18] pt-6">
                            <span className="text-lg font-semibold text-[#d85c43]">{String(gridStart + index).padStart(2, "0")}</span>
                            <h4 className="mt-3 text-xl font-bold leading-[1.25] tracking-[-0.01em]"><Link href={`/blog/${article.slug}`} className="hover:underline hover:underline-offset-4">{article.title}</Link></h4>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5b646a]">{article.excerpt}</p>
                            <StoryMeta article={article} className="mt-4" />
                        </article>
                    ))}
                </div>}
            </div>}
        </section>

        {!isError && <Pager page={page} totalPages={totalPages} onChange={setPage} disabled={isFetching || isPlaceholderData} />}

        {/* ─── split CTA footer ───────────────────────────────────── */}
        <section className="grid md:grid-cols-2">
            <div className="bg-[#e0aa18] px-6 py-16 text-[#183b35] md:px-12 md:py-20">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em]">Stay connected</p>
                <h3 className="mt-4 max-w-xs text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">Get new field stories in your inbox.</h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-[#294842]">One dispatch a month. No noise, just what&rsquo;s happening in the communities we work alongside.</p>
                <Link href="/contact" className="mt-7 inline-flex items-center gap-3 rounded-full border border-[#183b35] px-6 py-3 text-sm font-semibold">Subscribe <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="bg-[#d85c43] px-6 py-16 text-white md:px-12 md:py-20">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">Get involved</p>
                <h3 className="mt-4 max-w-xs text-3xl font-bold leading-[1.1] tracking-[-0.02em] sm:text-4xl">Have a story from the field?</h3>
                <p className="mt-5 max-w-sm text-sm leading-6 text-white/80">If you work alongside HOVUCA and have a story worth telling, we&rsquo;d like to help you tell it.</p>
                <Link href="/contact" className="mt-7 inline-flex items-center gap-3 rounded-full border border-white px-6 py-3 text-sm font-semibold">Pitch a story <ArrowRight className="h-4 w-4" /></Link>
            </div>
        </section>
        <section className="bg-white px-6 py-12 text-center md:py-14" aria-label="Continue exploring">
            <Link href="/about" className="inline-flex items-center gap-3 text-sm font-semibold text-[#183b35] underline decoration-[#e0aa18] underline-offset-8 transition-colors hover:text-[#d85c43] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">
                Learn more about HOVUCA <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
        </section>
    </div>;
}
