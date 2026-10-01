"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ChevronLeft, ChevronRight, Download, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { adminService, adminKeys, adminErrors, displayAdminValue, type AdminRecord } from "@/services/admin.service";
import { AdminError, AdminSkeleton } from "./AdminStates";
import { AdminRecordEditor } from "./AdminRecordEditor";

const selectClass = "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

function exportPage(records: AdminRecord[], columns: string[], title: string) {
    const cell = (value: unknown) => {
        const raw = displayAdminValue(value);
        const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
        return `"${safe.replaceAll('"', '""')}"`;
    };
    const csv = [columns.map(cell).join(","), ...records.map(record => columns.map(column => cell(record._relations[column] ?? record[column])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${title.toLowerCase().replaceAll(" ", "-")}-page.csv`; link.click(); URL.revokeObjectURL(url);
}

export function AdminResourcePage({ section }: { section: string }) {
    const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
    const qc = useQueryClient();
    const recordId = searchParams.get("record");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const search = searchParams.get("search") ?? "";
    const archived = searchParams.get("archived") === "true";
    const [archiveTarget, setArchiveTarget] = useState<AdminRecord | null>(null);
    const schema = useQuery({ queryKey: adminKeys.schema(section), queryFn: () => adminService.schema(section) });
    const params: Record<string, string | number> = { page, page_size: 20 };
    searchParams.forEach((value, key) => { if (key !== "record") params[key] = value; });
    const records = useQuery({ queryKey: adminKeys.records(section, params), queryFn: () => adminService.list(section, params), enabled: schema.isSuccess });
    const detail = useQuery({ queryKey: [...adminKeys.record(section, recordId ?? ""), archived], queryFn: () => adminService.record(section, recordId!, archived), enabled: Boolean(recordId && recordId !== "new" && schema.isSuccess) });
    const updateParams = (updates: Record<string, string | null>, resetPage = false) => {
        const next = new URLSearchParams(searchParams.toString());
        if (resetPage) next.delete("page");
        Object.entries(updates).forEach(([key, value]) => value === null || value === "" ? next.delete(key) : next.set(key, value));
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    };
    const archive = useMutation({
        mutationFn: () => adminService.archive(section, archiveTarget!.id, archived),
        onSuccess: async () => { await qc.invalidateQueries(); toast.success(archived ? "Record restored." : "Record archived."); setArchiveTarget(null); },
        onError: error => toast.error(Object.values(adminErrors(error)).join(" ")),
    });
    if (schema.isLoading) return <AdminSkeleton />;
    if (schema.isError) return <AdminError error={schema.error} retry={() => schema.refetch()} />;
    if (!schema.data) return null;
    const config = schema.data; const fields = config.fields ?? []; const rows = records.data?.results ?? [];
    if (recordId) {
        const close = () => updateParams({ record: null });
        if (recordId === "new") return config.permissions.create ? <AdminRecordEditor key="new" section={section} schema={config} onClose={close} /> : <div>Creation is unavailable. <Button onClick={close}>Back to list</Button></div>;
        const record = detail.data;
        if (detail.isLoading) return <AdminSkeleton />;
        if (detail.isError) return <AdminError error={detail.error} retry={() => detail.refetch()} />;
        if (record) return <AdminRecordEditor key={record.id} section={section} schema={config} record={record} onClose={close} />;
        return <div className="space-y-3"><p>This record is unavailable. Return to the list and try again.</p><Button onClick={close}>Back to list</Button></div>;
    }
    const filters = fields.filter(field => field.type === "choice" || field.type === "boolean");
    return <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div><h1 className="text-3xl font-semibold tracking-tight text-foreground">{config.title}</h1><p className="mt-2 text-sm text-muted-foreground">{records.isLoading ? "Loading records…" : `${records.data?.count ?? 0} ${archived ? "archived" : "active"} records`}{!config.permissions.edit ? " · Read-only records" : " · Manage details and keep information current"}</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!rows.length} onClick={() => exportPage(rows, config.columns, config.title)}><Download />Export this page</Button>{config.permissions.create && !archived && <Button onClick={() => updateParams({ record: "new" })}><Plus />Add record</Button>}</div>
        </header>
        <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); updateParams({ search: String(data.get("search") ?? "") }, true); }} className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input key={search} name="search" aria-label={`Search ${config.title.toLowerCase()}`} placeholder={`Search ${config.title.toLowerCase()}…`} defaultValue={search} className="h-10 pl-9" /></div><Button variant="outline" type="submit">Search</Button>
            <select aria-label="Sort records" className={selectClass} value={searchParams.get("ordering") ?? "-created_at"} onChange={event => updateParams({ ordering: event.target.value }, true)}><option value="-created_at">Newest first</option><option value="created_at">Oldest first</option><option value="-updated_at">Recently updated</option></select>
            {config.permissions.archive && <Button type="button" variant={archived ? "secondary" : "outline"} onClick={() => updateParams({ archived: archived ? null : "true" }, true)}><Archive />{archived ? "Show active" : "Archived records"}</Button>}
        </form>
        {filters.length > 0 && <details className="border-b border-border pb-4" open={filters.some(field => searchParams.has(field.name))}><summary className="cursor-pointer text-sm font-medium text-muted-foreground">Filter records</summary><div className="mt-3 flex flex-wrap gap-3">{filters.map(field => <label key={field.name} className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">{field.label}<select className={selectClass} value={searchParams.get(field.name) ?? ""} onChange={event => updateParams({ [field.name]: event.target.value }, true)}><option value="">All</option>{field.type === "boolean" ? <><option value="true">Yes</option><option value="false">No</option></> : field.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>)}<Button variant="ghost" className="self-end" onClick={() => router.replace(pathname)}>Clear filters</Button></div></details>}
        {records.isError ? <AdminError error={records.error} retry={() => records.refetch()} /> : records.isLoading ? <AdminSkeleton /> : <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">{config.title} records, page {page}</caption><thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{config.columns.map(column => <th scope="col" key={column} className="px-4 py-3 font-semibold">{fields.find(field => field.name === column)?.label ?? column.replaceAll("_", " ")}</th>)}<th scope="col" className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">
                {rows.map(row => <tr key={row.id} className="hover:bg-muted/25">{config.columns.map((column, index) => { const field = fields.find(item => item.name === column); const text = row._relations[column] ?? displayAdminValue(row[column], field); return <td key={column} className="max-w-64 px-4 py-4"><span title={text} className={index === 0 ? "line-clamp-2 font-medium text-foreground" : "line-clamp-2 text-muted-foreground"}>{text}</span></td>; })}<td className="px-4 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => updateParams({ record: row.id })}>{config.permissions.edit && !archived ? "Edit" : "View"}</Button>{config.permissions.archive && <Button size="sm" variant="ghost" aria-label={`${archived ? "Restore" : "Archive"} ${row._label}`} onClick={() => setArchiveTarget(row)}>{archived ? <RotateCcw /> : <Archive />}</Button>}</div></td></tr>)}
                {!rows.length && <tr><td colSpan={config.columns.length + 1} className="px-6 py-14 text-center"><h2 className="font-semibold text-foreground">{search || filters.some(field => searchParams.has(field.name)) ? "No matching records" : archived ? "The archive is empty" : "Ready for your first record"}</h2><p className="mt-2 text-sm text-muted-foreground">{search ? "Try a different search or clear the filters." : archived ? "Archived records can be restored here." : config.permissions.create ? "Use Add record to create and save your first entry." : "Records will appear here when people use the website."}</p></td></tr>}
            </tbody></table></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"><span className="text-xs text-muted-foreground">Page {page} of {records.data?.total_pages ?? 1} · {rows.length} of {records.data?.count ?? 0} records</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!records.data?.previous} onClick={() => updateParams({ page: String(page - 1) })}><ChevronLeft />Previous</Button><Button variant="outline" size="sm" disabled={!records.data?.next} onClick={() => updateParams({ page: String(page + 1) })}>Next<ChevronRight /></Button></div></div>
        </div>}
        <Dialog open={Boolean(archiveTarget)} onOpenChange={open => { if (!open && !archive.isPending) setArchiveTarget(null); }}><DialogContent><DialogHeader><DialogTitle>{archived ? "Restore record?" : "Archive record?"}</DialogTitle><DialogDescription>{archiveTarget?._label}. {archived ? "This record will return to the active list." : "This removes the record from active lists. You can restore it from Archived records."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={archive.isPending} onClick={() => setArchiveTarget(null)}>Cancel</Button><Button disabled={archive.isPending} onClick={() => archive.mutate()}>{archive.isPending ? "Working…" : archived ? "Restore record" : "Archive record"}</Button></DialogFooter></DialogContent></Dialog>
    </div>;
}
