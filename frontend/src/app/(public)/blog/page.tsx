"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";

import { PageLoader } from "@/components/shared";
import { useArticles } from "@/hooks";

function ArticleMeta({ date, minutes }: { date: string | null; minutes: number }) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            {date && <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{minutes} min read</span>
        </div>
    );
}

export default function BlogPage() {
    const { data, isLoading, isError } = useArticles({ page_size: 100 });
    const articles = data?.results ?? [];
    const [featured, ...remaining] = articles;

    if (isLoading) return <PageLoader />;

    return (
        <main className="min-h-screen bg-[#fbfaf8] text-neutral-900">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-20">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5d2d84]">Stories and updates</p>
                    <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
                        <h1 className="font-display text-5xl font-extrabold tracking-[-0.045em] sm:text-6xl">From HOVUCA</h1>
                        <p className="text-lg leading-8 text-neutral-600">Community voices, advocacy updates and lessons from our work with children and young people.</p>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20">
                {isError ? (
                    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">We could not load the articles. Please try again shortly.</p>
                ) : !featured ? (
                    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">No articles have been published yet.</p>
                ) : (
                    <>
                        <article className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white lg:grid-cols-[1.1fr_.9fr]">
                            <div className="relative min-h-72 bg-neutral-100 lg:min-h-[430px]">
                                {featured.cover_image ? <Image src={featured.cover_image} alt={featured.cover_image_alt || featured.title} fill priority loading="eager" sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" /> : <Image src="/heros/hero1.png" alt="HOVUCA community work" fill priority loading="eager" sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />}
                            </div>
                            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                                {featured.category && <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5d2d84]">{featured.category.name}</p>}
                                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl"><Link href={`/blog/${featured.slug}`} className="hover:text-[#5d2d84]">{featured.title}</Link></h2>
                                <p className="mt-5 line-clamp-4 leading-7 text-neutral-600">{featured.excerpt}</p>
                                <div className="mt-7"><ArticleMeta date={featured.published_at} minutes={featured.reading_time_minutes} /></div>
                                <Link href={`/blog/${featured.slug}`} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#35145f]">Read the story <ArrowRight className="h-4 w-4" /></Link>
                            </div>
                        </article>

                        {remaining.length > 0 && (
                            <div className="mt-14 grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                                {remaining.map((article) => (
                                    <article key={article.id} className="group border-t border-neutral-300 pt-6">
                                        {article.cover_image && <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100"><Image src={article.cover_image} alt={article.cover_image_alt || article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" /></div>}
                                        {article.category && <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5d2d84]">{article.category.name}</p>}
                                        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.025em]"><Link href={`/blog/${article.slug}`} className="hover:text-[#5d2d84]">{article.title}</Link></h2>
                                        <p className="mt-4 line-clamp-3 leading-7 text-neutral-600">{article.excerpt}</p>
                                        <div className="mt-5"><ArticleMeta date={article.published_at} minutes={article.reading_time_minutes} /></div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
