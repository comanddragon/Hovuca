"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks";
import { formatDate } from "@/lib/utils";

const statuses = { planning: "Planning", in_progress: "In progress", completed: "Completed", on_hold: "On hold" };
const field = "mt-2 min-h-12 w-full border border-[#183b35]/30 bg-white px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]";
const action = "min-h-12 border border-[#183b35]/40 px-5 py-3 font-semibold hover:bg-[#183b35] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const PAGE_SIZE = 6;
export default function ProjectsDirectory() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 400); return () => clearTimeout(timer); }, [search]);
    const { data, isLoading, isFetching, isError, refetch, isPlaceholderData } = useProjects({ search: query, status, page, page_size: PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
    const reset = () => { setSearch(""); setQuery(""); setStatus(""); setPage(1); };
    return <section id="project-directory" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 md:py-24"><h2 className="font-display text-3xl font-bold sm:text-4xl">Explore our projects</h2>
        <div className="mt-8 grid gap-5 border-y border-[#183b35]/20 py-6 sm:grid-cols-[2fr_1fr_auto]"><label htmlFor="project-search" className="text-sm font-semibold">Search projects<input id="project-search" type="search" value={search} placeholder="Search by title or topic" onChange={event => { setSearch(event.target.value); setPage(1); }} className={field} /></label><label htmlFor="project-status" className="text-sm font-semibold">Project status<select id="project-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className={field}><option value="">All statuses</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button onClick={reset} className={`${action} self-end`}>Clear filters</button></div>
        <div aria-live="polite" className="py-6 text-sm text-[#53645f]">{isLoading ? "Loading projects…" : isFetching ? "Updating projects…" : !isError ? `${data?.count ?? 0} project${data?.count === 1 ? "" : "s"} found` : "Projects are temporarily unavailable."}</div>
        {isError ? <div role="alert" className="border-y border-[#183b35]/20 py-10"><h3 className="font-display text-2xl font-bold">We couldn’t load the projects.</h3><p className="mt-3 text-[#53645f]">Please try again to see the latest projects.</p><button className={`${action} mt-6`} onClick={() => refetch()} disabled={isFetching}>Try again</button></div> : !isLoading && !data?.results.length ? <div className="border-y border-[#183b35]/20 py-12"><h3 className="font-display text-2xl font-bold">{search || status ? "No projects match these filters." : "Projects will appear here when published."}</h3>{(search || status) && <button onClick={reset} className={`${action} mt-6`}>Show all projects</button>}</div> : <div aria-busy={isFetching} className="grid gap-x-10 gap-y-12 md:grid-cols-2">{data?.results.map(project => <article key={project.id} className="border-b border-[#183b35]/20 pb-8"><Link href={`/projects/${project.slug}`} className="group block"><div className="relative aspect-[3/2] overflow-hidden bg-[#e3e8dd]">{project.cover_image ? <Image src={project.cover_image} alt={project.cover_image_alt || project.title} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]" /> : <div className="flex h-full items-end p-8"><p className="font-display text-3xl text-[#183b35]/60">HOVUCA<br />Projects</p></div>}</div><div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-[#53645f]"><span>{statuses[project.status]}</span>{project.start_date && <span>{formatDate(project.start_date)}</span>}</div><h3 className="mt-3 flex items-start justify-between gap-4 font-display text-3xl font-bold leading-tight group-hover:underline group-hover:underline-offset-4">{project.title}<ArrowUpRight aria-hidden="true" className="mt-1 size-6 shrink-0" /></h3><p className="mt-4 line-clamp-3 leading-7 text-[#53645f]">{project.excerpt || project.description}</p></Link></article>)}</div>}
        {!isError && totalPages > 1 && <nav aria-label="Project pagination" className="mt-12 flex flex-wrap items-center justify-between gap-4"><button className={action} disabled={page <= 1 || isPlaceholderData || isFetching} onClick={() => setPage(value => value - 1)}><ArrowLeft aria-hidden="true" className="mr-2 inline size-4" />Previous</button><span aria-live="polite" className="text-sm">Page {page} of {totalPages}</span><button className={action} disabled={page >= totalPages || isPlaceholderData || isFetching} onClick={() => setPage(value => value + 1)}>Next<ArrowRight aria-hidden="true" className="ml-2 inline size-4" /></button></nav>}
    </section>;
}
