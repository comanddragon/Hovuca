"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useProjects } from "@/hooks";
import { evidenceLabel, evidenceTypes, projectStatuses } from "./project-labels";
import styles from "./projects.module.css";

const PAGE_SIZE = 6;

export default function ProjectsDirectory() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [evidence, setEvidence] = useState("");
    const [page, setPage] = useState(1);
    const heading = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isFetching, isError, refetch, isPlaceholderData } = useProjects({ search: query, status, evidence_type: evidence, page, page_size: PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
    const filtered = Boolean(query || status || evidence);
    const reset = () => { setSearch(""); setQuery(""); setStatus(""); setEvidence(""); setPage(1); };
    const turnPage = (next: number) => { setPage(next); heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start" }); };

    return <section id="project-directory" className={styles.directory} aria-labelledby="directory-heading">
        <div className={styles.directoryHeading}>
            <h2 id="directory-heading" ref={heading} tabIndex={-1}>Explore the archive</h2>
            <p>Proposals, plans and research, with their sources in view.</p>
        </div>
        <div className={styles.filters}>
            <label htmlFor="project-search">Search projects
                <span className={styles.searchField}><Search size={18} aria-hidden="true" /><input id="project-search" type="search" value={search} placeholder="Title, topic or place" onChange={event => setSearch(event.target.value)} /></span>
            </label>
            <label htmlFor="project-evidence">Document type
                <select id="project-evidence" value={evidence} onChange={event => { setEvidence(event.target.value); setPage(1); }}><option value="">All document types</option>{Object.entries(evidenceTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label htmlFor="project-status">Project status
                <select id="project-status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(projectStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <button onClick={reset} className={styles.button}>Clear filters</button>
        </div>
        <div aria-live="polite" role="status" className={styles.resultCount}>{isLoading ? "Loading projects…" : isFetching ? "Updating projects…" : !isError ? `${data?.count ?? 0} project${data?.count === 1 ? "" : "s"}${filtered ? " matching your filters" : " in the archive"}` : "Projects are temporarily unavailable."}</div>
        {isError ? <div role="alert" className={styles.message}><h3>We couldn’t load the projects.</h3><p>Please try again to explore the archive.</p><button className={styles.button} onClick={() => refetch()} disabled={isFetching}>Try again</button></div> : isLoading ? <div aria-hidden="true" className={styles.skeleton}><div /><div /><div /></div> : !data?.results.length ? <div className={styles.message}><h3>{filtered ? "No projects match these filters." : "Projects will appear here when published."}</h3>{filtered && <><p>Try another title, topic or place, or clear your filters.</p><button onClick={reset} className={styles.button}>Show all projects</button></>}</div> : <div aria-busy={isFetching} className={styles.results}>{data.results.map(project => <article key={project.id} className={styles.row}>
            <div className={styles.year}>{project.source_year ?? (project.start_date ? project.start_date.slice(0, 4) : "—")}</div>
            <div className={styles.rowBody}>
                <div className={styles.recordMeta}><span>{evidenceLabel(project)}</span>{project.location && <span>{project.location}</span>}</div>
                <h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
                <p>{project.excerpt}</p>
                <Link className={styles.readLink} href={`/projects/${project.slug}`}>Read project summary <ArrowUpRight size={18} aria-hidden="true" /><span className="sr-only">: {project.title}</span></Link>
            </div>
            {project.cover_image && <Link href={`/projects/${project.slug}`} className={styles.thumbnail} tabIndex={-1} aria-hidden="true"><Image src={project.cover_image} alt="" fill sizes="200px" className="object-cover" /></Link>}
        </article>)}</div>}
        {!isError && totalPages > 1 && <nav aria-label="Project pagination" className={styles.pagination}>
            <button className={styles.button} disabled={page <= 1 || isPlaceholderData || isFetching} onClick={() => turnPage(page - 1)}><ArrowLeft size={18} aria-hidden="true" />Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className={styles.button} disabled={page >= totalPages || isPlaceholderData || isFetching} onClick={() => turnPage(page + 1)}>Next<ArrowRight size={18} aria-hidden="true" /></button>
        </nav>}
    </section>;
}
