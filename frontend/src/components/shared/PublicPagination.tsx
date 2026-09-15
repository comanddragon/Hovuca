"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
export function PublicPagination({ page, totalPages, onChange, disabled = false, label }: { page: number; totalPages: number; onChange: (page: number) => void; disabled?: boolean; label: string }) {
    if (totalPages <= 1) return null;
    const action = "inline-flex min-h-12 items-center gap-3 border border-[#183b35]/40 px-5 py-3 font-semibold hover:bg-[#183b35] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] disabled:cursor-not-allowed disabled:opacity-40";
    return <nav aria-label={label} className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <button className={action} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft aria-hidden="true" className="size-4" />Previous</button>
        <span aria-live="polite" className="text-sm">Page {page} of {totalPages}</span>
        <button className={action} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>Next<ArrowRight aria-hidden="true" className="size-4" /></button>
    </nav>;
}
