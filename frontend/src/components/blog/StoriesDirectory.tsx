"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useArticles, useCategories } from "@/hooks";
import { PublicPagination } from "@/components/shared/PublicPagination";
import type { Article } from "@/types";

const PAGE_SIZE = 9;
const field = "mt-2 min-h-12 w-full border border-[#183b35]/30 bg-white px-4 py-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]";
const action = "inline-flex min-h-12 items-center justify-center gap-3 border border-[#183b35]/40 px-5 py-3 font-semibold hover:bg-[#183b35] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] disabled:opacity-40";
function StoryMeta({ article }: { article: Article }) {
    return <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#53645f]">
        {article.category && <span>{article.category.name}</span>}
        {article.published_at && <time dateTime={article.published_at}>{new Date(article.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time>}
        {article.reading_time_minutes > 0 && <span>{article.reading_time_minutes} min read</span>}
    </div>;
}
export default function StoriesDirectory() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const categories = useCategories();
    const { data, isLoading, isFetching, isError, isPlaceholderData, refetch } = useArticles({ search: query, category: category || undefined, status: "published", page, page_size: PAGE_SIZE });
    const articles = data?.results ?? [];
    const lead = page === 1 ? articles[0] : undefined;
    const remaining = lead ? articles.slice(1) : articles;
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
    const clear = () => { setSearch(""); setQuery(""); setCategory(""); setPage(1); };
    return <section aria-labelledby="stories-heading" className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <h2 id="stories-heading" className="font-display text-3xl font-bold sm:text-4xl">Explore field stories</h2>
        <form onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setPage(1); }} className="mt-8 grid gap-5 border-y border-[#183b35]/20 py-6 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto_auto]">
            <label htmlFor="story-search" className="text-sm font-semibold">Search stories<input id="story-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title or topic" className={field} /></label>
            <label htmlFor="story-category" className="text-sm font-semibold">Category<select id="story-category" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} className={field}><option value="">All categories</option>{categories.data?.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
            <button type="submit" className={`${action} self-end bg-[#183b35] text-white`}><Search aria-hidden="true" className="size-4" />Search</button><button type="button" className={`${action} self-end`} onClick={clear}>Clear filters</button>
        </form>
        {categories.isError && <p role="status" className="mt-4 text-sm text-[#53645f]">Category options could not load. You can still search stories. <button className="inline-flex min-h-12 items-center underline underline-offset-4" onClick={() => categories.refetch()}>Retry categories</button></p>}
        <p aria-live="polite" className="py-6 text-sm text-[#53645f]">{isLoading ? "Loading stories…" : isFetching ? "Updating stories…" : isError ? "Stories are temporarily unavailable." : `${data?.count ?? 0} ${data?.count === 1 ? "story" : "stories"} found`}</p>
        {isError ? <div role="alert" className="border-y border-[#183b35]/20 py-10"><h3 className="font-display text-2xl font-bold">We couldn’t load the stories.</h3><p className="mt-3 text-[#53645f]">Please try again to see the latest articles.</p><button disabled={isFetching} className={`${action} mt-6`} onClick={() => refetch()}>Try again</button></div> : !isLoading && !articles.length ? <div className="border-y border-[#183b35]/20 py-12"><h3 className="font-display text-2xl font-bold">{query || category ? "No stories match these filters." : "Stories will appear here when published."}</h3>{(query || category) && <button className={`${action} mt-6`} onClick={clear}>Show all stories</button>}</div> : <div aria-busy={isFetching}>
            {lead && <article className="mb-12 grid border-b border-[#183b35]/20 pb-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
                {lead.cover_image && <div className="relative mb-7 block aspect-[3/2] overflow-hidden bg-[#e7ebdf] lg:mb-0"><Image src={lead.cover_image} alt={lead.cover_image_alt || lead.title} fill priority sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" /></div>}
                <div className={`flex flex-col justify-center ${!lead.cover_image ? "lg:col-span-2 lg:max-w-4xl" : ""}`}>
                    <h3 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"><Link href={`/blog/${lead.slug}`} className="hover:underline hover:underline-offset-4">{lead.title}</Link></h3>
                    <div className="mt-5"><StoryMeta article={lead} /></div><p className="mt-5 line-clamp-4 text-lg leading-8 text-[#53645f]">{lead.excerpt}</p>
                    <Link href={`/blog/${lead.slug}`} className="mt-7 inline-flex min-h-12 w-fit items-center gap-4 font-semibold underline underline-offset-4">Read the story<ArrowUpRight aria-hidden="true" className="size-5" /><span className="sr-only">: {lead.title}</span></Link>
                </div>
            </article>}
            <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{remaining.map(article => <article key={article.id} className="border-b border-[#183b35]/20 pb-8">
                {article.cover_image && <div className="relative mb-5 block aspect-[3/2] overflow-hidden bg-[#e7ebdf]"><Image src={article.cover_image} alt={article.cover_image_alt || article.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px" className="object-cover" /></div>}
                <h3 className="font-display text-2xl font-bold leading-tight"><Link href={`/blog/${article.slug}`} className="hover:underline hover:underline-offset-4">{article.title}</Link></h3><div className="mt-4"><StoryMeta article={article} /></div><p className="mt-4 line-clamp-3 leading-7 text-[#53645f]">{article.excerpt}</p>
            </article>)}</div>
        </div>}
        {!isError && <PublicPagination label="Story pagination" page={page} totalPages={totalPages} onChange={setPage} disabled={isFetching || isPlaceholderData} />}
    </section>;
}
