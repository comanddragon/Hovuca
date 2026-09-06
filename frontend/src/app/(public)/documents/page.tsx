"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Search } from "lucide-react";

import { PageLoader } from "@/components/shared";
import { useResources } from "@/hooks";

export default function DocumentsPage() {
    const { data: documents = [], isLoading, isError } = useResources();
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return documents;
        return documents.filter((document) => `${document.title} ${document.description} ${document.category}`.toLowerCase().includes(value));
    }, [documents, query]);

    if (isLoading) return <PageLoader />;

    return (
        <main className="min-h-screen bg-[#fbfaf8] text-neutral-900">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-20">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5d2d84]">Resource library</p>
                    <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
                        <div><h1 className="font-display text-5xl font-extrabold tracking-[-0.045em] sm:text-6xl">Documents</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">Policies, reports, advocacy briefs, presentations and publications from HOVUCA.</p></div>
                        <label className="flex items-center gap-3 rounded-xl border border-neutral-300 bg-[#fbfaf8] px-4 py-3 focus-within:border-[#5d2d84] focus-within:ring-2 focus-within:ring-[#5d2d84]/10">
                            <Search className="h-5 w-5 text-neutral-400" />
                            <span className="sr-only">Search documents</span>
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the library" className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
                        </label>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-20">
                {isError ? (
                    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">We could not load the documents. Please try again shortly.</p>
                ) : documents.length === 0 ? (
                    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">No documents have been published yet.</p>
                ) : filtered.length === 0 ? (
                    <p className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">No documents match “{query}”.</p>
                ) : (
                    <div>
                        <p className="mb-6 text-sm text-neutral-500">{filtered.length} {filtered.length === 1 ? "document" : "documents"}</p>
                        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                            {filtered.map((document) => (
                                <article key={document.id} className="grid gap-5 py-7 md:grid-cols-[56px_1fr_auto] md:items-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eee7f3] text-[#35145f]"><FileText className="h-6 w-6" aria-hidden="true" /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5d2d84]">{document.category}</p>
                                        <h2 className="mt-2 font-display text-xl font-extrabold leading-snug sm:text-2xl">{document.title}</h2>
                                        {document.description && <p className="mt-2 max-w-3xl leading-7 text-neutral-600">{document.description}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 md:justify-end">
                                        <a href={document.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#35145f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4d2477]">Open <ExternalLink className="h-4 w-4" /></a>
                                        <a href={document.file_url} download className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-[#5d2d84] hover:text-[#5d2d84]">Download <Download className="h-4 w-4" /></a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
