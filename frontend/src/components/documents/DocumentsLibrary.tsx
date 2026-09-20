"use client";
import { useMemo, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useResources } from "@/hooks";
import { DocumentPreview } from "./DocumentPreview";
import { PublicPagination } from "@/components/shared/PublicPagination";
const PAGE_SIZE = 12;
const field = "mt-2 min-h-12 w-full border border-[var(--brand-forest)]/30 bg-white px-4 py-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-forest)]";
const action = "inline-flex min-h-12 items-center justify-center gap-3 border border-[var(--brand-forest)]/40 px-5 py-3 text-sm font-semibold hover:bg-[var(--brand-forest)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-forest)]";
export default function DocumentsLibrary() {
    const { data: documents = [], isLoading, isFetching, isError, refetch } = useResources();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const categories = useMemo(() => [...new Set(documents.map(document => document.category).filter(Boolean))].sort(), [documents]);
    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase();
        return documents.filter(document => (!category || document.category === category) && (!search || `${document.title} ${document.description} ${document.category}`.toLowerCase().includes(search)));
    }, [documents, query, category]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const clear = () => { setQuery(""); setCategory(""); setPage(1); };
    return <section aria-labelledby="library-heading" className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <h2 id="library-heading" className="font-display text-3xl font-bold sm:text-4xl">Explore the document library</h2>
        <div className="mt-8 grid gap-5 border-y border-[var(--brand-forest)]/20 py-6 sm:grid-cols-[2fr_1fr_auto]">
            <label htmlFor="document-search" className="text-sm font-semibold">Search documents<input id="document-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search the library" className={field} /></label>
            <label htmlFor="document-category" className="text-sm font-semibold">Category<select id="document-category" value={category} onChange={event => { setCategory(event.target.value); setPage(1); }} className={field}><option value="">All categories</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
            <button className={`${action} self-end`} onClick={clear}>Clear filters</button>
        </div>
        <p aria-live="polite" className="py-6 text-sm text-[var(--brand-body-muted)]">{isLoading ? "Loading documents…" : isFetching ? "Updating documents…" : isError ? "The library is temporarily unavailable." : `${filtered.length} document${filtered.length === 1 ? "" : "s"} found`}</p>
        {isError ? <div role="alert" className="border-y border-[var(--brand-forest)]/20 py-10"><h3 className="font-display text-2xl font-bold">We couldn’t load the library.</h3><p className="mt-3 text-[var(--brand-body-muted)]">Please try again to access the documents.</p><button disabled={isFetching} className={`${action} mt-6 disabled:opacity-40`} onClick={() => refetch()}>Try again</button></div> : !isLoading && !filtered.length ? <div className="border-y border-[var(--brand-forest)]/20 py-12"><h3 className="font-display text-2xl font-bold">{query || category ? "No documents match these filters." : "Documents will appear here when published."}</h3>{(query || category) && <button className={`${action} mt-6`} onClick={clear}>Show all documents</button>}</div> : <div aria-busy={isFetching} className="divide-y divide-[var(--brand-forest)]/20 border-y border-[var(--brand-forest)]/20">{visible.map(document => <article key={document.id} className="grid gap-6 py-8 sm:grid-cols-[9rem_1fr] lg:grid-cols-[9rem_1fr_auto] lg:items-center">
            <DocumentPreview url={document.file_url} title={document.title} />
            <div><h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{document.title}</h3><div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--brand-body-muted)]">{document.category && <span>{document.category}</span>}{document.published_at && <time dateTime={document.published_at}>{new Date(document.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time>}</div>{document.description && <p className="mt-4 max-w-3xl leading-7 text-[var(--brand-body-muted)]">{document.description}</p>}</div>
            <div className="flex flex-wrap gap-3 sm:col-start-2 lg:col-start-auto lg:flex-col">
                <a href={document.file_url} target="_blank" rel="noopener noreferrer" className={`${action} bg-[var(--brand-forest)] text-white`}>Open<ExternalLink aria-hidden="true" className="size-4" /><span className="sr-only"> {document.title} in a new tab</span></a>
                <a href={document.file_url} download className={action}>Download<Download aria-hidden="true" className="size-4" /><span className="sr-only"> {document.title}</span></a>
            </div>
        </article>)}</div>}
        {!isError && <PublicPagination label="Document pagination" page={currentPage} totalPages={totalPages} onChange={setPage} />}
    </section>;
}
