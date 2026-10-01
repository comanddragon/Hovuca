"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { adminService, adminErrors, displayAdminValue, type AdminField, type AdminRecord, type AdminSection, type AdminValues } from "@/services/admin.service";

const controlClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function RelationPicker({ section, field, value, label, onChange, disabled }: {
    section: string; field: AdminField; value: unknown; label?: string; onChange: (value: unknown) => void; disabled: boolean;
}) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [labels, setLabels] = useState<Record<string, string>>({});
    const query = useQuery({ queryKey: ["admin-options", section, field.name, search, page], queryFn: () => adminService.options(section, field.name, search, page) });
    const selected = field.multiple ? (Array.isArray(value) ? value.map(String) : []) : value ? [String(value)] : [];
    const options = query.data?.results ?? [];
    const currentLabels = Object.fromEntries(options.map(option => [option.value, option.label]));
    const nameFor = (id: string) => currentLabels[id] || labels[id] || label || id;
    const pick = (id: string, text: string) => {
        setLabels(old => ({ ...old, [id]: text }));
        onChange(field.multiple ? selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id] : id);
    };
    return <div className="space-y-2">
        <Input aria-label={`Search ${field.label.toLowerCase()} options`} placeholder="Find a record…" value={search} disabled={disabled} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        {field.multiple ? <>
            {selected.length > 0 && <div className="flex flex-wrap gap-2">{selected.map(id => <Button type="button" key={id} variant="secondary" size="sm" disabled={disabled} onClick={() => onChange(selected.filter(item => item !== id))}>{nameFor(id)}<X className="size-3" /><span className="sr-only">Remove</span></Button>)}</div>}
            <div className="max-h-40 overflow-y-auto rounded-md border border-input p-2">
                {options.map(option => <label key={option.value} className="flex cursor-pointer items-center gap-2 p-2 text-sm hover:bg-muted"><input type="checkbox" checked={selected.includes(option.value)} disabled={disabled} onChange={() => pick(option.value, option.label)} />{option.label}</label>)}
            </div>
        </> : <select id={field.name} className={controlClass} value={String(value ?? "")} disabled={disabled || query.isLoading} required={field.required} onChange={e => { const choice = options.find(option => option.value === e.target.value); pick(e.target.value, choice?.label ?? ""); }}>
            <option value="">{query.isLoading ? "Loading options…" : "Choose a record"}</option>
            {selected.filter(id => !options.some(option => option.value === id)).map(id => <option key={id} value={id}>{nameFor(id)}</option>)}
            {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>}
        {query.isError && <p role="alert" className="text-sm text-destructive">Could not load options. <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p>}
        {!query.isLoading && !query.isError && !options.length && <p className="text-xs text-muted-foreground">No matching records. Create the related record in its section first.</p>}
        {(query.data?.next || query.data?.previous) && <div className="flex items-center gap-2"><Button type="button" size="sm" variant="ghost" aria-label="Previous options" disabled={!query.data.previous} onClick={() => setPage(p => p - 1)}><ChevronLeft /></Button><span className="text-xs text-muted-foreground">Options page {page}</span><Button type="button" size="sm" variant="ghost" aria-label="Next options" disabled={!query.data.next} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button></div>}
    </div>;
}

function initialValues(schema: AdminSection, record?: AdminRecord): AdminValues {
    return Object.fromEntries((schema.fields ?? []).filter(field => !field.readonly && !(record && field.create_only)).map(field => {
        let value = record?.[field.name] ?? field.default;
        if (field.type === "json") value = JSON.stringify(value ?? (field.default ?? []), null, 2);
        if (field.type === "boolean") value = Boolean(value);
        if (field.multiple) value = value ?? [];
        if (field.type === "datetime" && value) {
            const date = new Date(String(value));
            if (!Number.isNaN(date.getTime())) value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
        if (field.type === "file" || field.type === "image") value = undefined;
        return [field.name, value ?? ""];
    }));
}

export function AdminRecordEditor({ section, schema, record, onClose }: { section: string; schema: AdminSection; record?: AdminRecord; onClose: () => void }) {
    const qc = useQueryClient();
    const [values, setValues] = useState<AdminValues>(() => initialValues(schema, record));
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fields = (schema.fields ?? []).filter(field => !(record && field.create_only));
    const readonly = !schema.permissions.edit || Boolean(record?.deleted_at);
    const change = (name: string, value: unknown) => { setValues(old => ({ ...old, [name]: value })); setDirty(true); setErrors(old => ({ ...old, [name]: "" })); };
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
        window.addEventListener("beforeunload", warn);
        const leave = (event: MouseEvent) => {
            const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
            if (dirty && link && !window.confirm("Discard your unsaved changes?")) {
                event.preventDefault(); event.stopPropagation();
            }
        };
        document.addEventListener("click", leave, true);
        return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", leave, true); };
    }, [dirty]);
    const close = () => { if (!dirty || window.confirm("Discard your unsaved changes?")) onClose(); };
    const mutation = useMutation({
        mutationFn: (payload: AdminValues) => adminService.save(section, payload, record?.id),
        onSuccess: async () => { await qc.invalidateQueries(); toast.success(record ? "Changes saved." : "Record created."); setDirty(false); onClose(); },
        onError: error => { setErrors(adminErrors(error)); toast.error("Could not save. Check the highlighted fields."); },
    });
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload: AdminValues = {};
        const validation: Record<string, string> = {};
        fields.filter(field => !field.readonly).forEach(field => {
            const value = values[field.name];
            if ((field.type === "file" || field.type === "image") && !(value instanceof File) && value !== null) return;
            try {
                if (field.type === "json") payload[field.name] = JSON.parse(String(value || "[]"));
                else if (field.type === "datetime" && value) payload[field.name] = new Date(String(value)).toISOString();
                else if (value === "" && field.nullable) payload[field.name] = null;
                else if (field.type === "number" && value !== "") payload[field.name] = String(value);
                else payload[field.name] = value;
            } catch { validation[field.name] = field.type === "json" ? "Enter valid JSON." : "Enter a valid value."; }
        });
        setErrors(validation);
        if (!Object.keys(validation).length) mutation.mutate(payload);
    };
    return <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
            <div><Button type="button" variant="ghost" size="sm" onClick={close}><ArrowLeft />Back to {schema.title.toLowerCase()}</Button><h2 className="mt-3 text-2xl font-semibold text-foreground">{record ? record._label : `New ${schema.singular || schema.title.toLowerCase()}`}</h2><p className="mt-1 text-sm text-muted-foreground">{readonly ? "Record details · read-only" : "Complete the details below. Required fields are marked *."}</p></div>
            {record && <span className="text-xs text-muted-foreground">Updated {displayAdminValue(record.updated_at, { type: "datetime", choices: [] } as unknown as AdminField)}</span>}
        </div>
        <form onSubmit={submit} className="space-y-6">
            {Object.entries(errors).some(([name, message]) => message && !fields.some(field => field.name === name)) && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{Object.entries(errors).filter(([name]) => !fields.some(field => field.name === name)).map(([name, message]) => <p key={name}>{message}</p>)}</div>}
            <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                {fields.filter(field => record || !field.readonly).map(field => {
                    const locked = readonly || field.readonly;
                    const value = values[field.name];
                    const wide = ["textarea", "richtext", "json"].includes(field.type);
                    const common = { id: field.name, disabled: mutation.isPending, required: field.required, "aria-invalid": Boolean(errors[field.name]), "aria-describedby": `${field.name}-help ${field.name}-error` };
                    return <div key={field.name} className={wide ? "md:col-span-2" : ""}>
                        <Label htmlFor={field.name} className="mb-2 block">{field.label}{field.required && !locked ? " *" : ""}</Label>
                        {locked ? <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap break-words">{record?._relations[field.name] ?? displayAdminValue(record?.[field.name], field)}</div>
                            : field.type === "relation" ? <RelationPicker section={section} field={field} value={value} label={record?._relations[field.name]} onChange={v => change(field.name, v)} disabled={mutation.isPending} />
                            : field.type === "boolean" ? <label className="flex min-h-10 items-center gap-2 text-sm"><input {...common} required={false} type="checkbox" checked={Boolean(value)} onChange={e => change(field.name, e.target.checked)} className="size-4 accent-primary" />Enabled</label>
                            : field.type === "choice" ? <select {...common} className={controlClass} value={String(value ?? "")} onChange={e => change(field.name, e.target.value)}><option value="">Choose {field.label.toLowerCase()}</option>{field.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>
                            : field.type === "richtext" ? <RichTextEditor value={String(value ?? "")} onChangeAction={v => change(field.name, v)} error={errors[field.name]} />
                            : ["textarea", "json"].includes(field.type) ? <Textarea {...common} value={String(value ?? "")} rows={field.type === "json" ? 5 : 4} maxLength={field.max_length ?? undefined} className={field.type === "json" ? "font-mono text-sm" : ""} onChange={e => change(field.name, e.target.value)} />
                            : ["image", "file"].includes(field.type) ? <div className="space-y-2"><Input {...common} required={field.required && !record?.[field.name]} type="file" accept={field.type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : undefined} onChange={e => change(field.name, e.target.files?.[0])} />{record?.[field.name] ? <div className="flex items-center gap-3"><a href={String(record[field.name])} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Open current file</a>{field.nullable && <Button type="button" variant="ghost" size="sm" onClick={() => change(field.name, null)}>{value === null ? <Check /> : <X />}{value === null ? "Marked for removal" : "Remove file"}</Button>}</div> : null}</div>
                            : <Input {...common} type={field.type === "datetime" ? "datetime-local" : ["number", "date", "email", "url", "password"].includes(field.type) ? field.type : "text"} autoComplete={field.type === "password" ? "new-password" : undefined} step={field.type === "number" ? field.step : undefined} maxLength={field.max_length ?? undefined} value={String(value ?? "")} onInput={e => change(field.name, e.currentTarget.value)} onBlur={e => { if (["date", "datetime"].includes(field.type) && e.currentTarget.value !== String(value ?? "")) change(field.name, e.currentTarget.value); }} onChange={e => change(field.name, e.target.value)} />}
                        {field.help && <p id={`${field.name}-help`} className="mt-1.5 text-xs leading-5 text-muted-foreground">{field.help}</p>}
                        {errors[field.name] && <p id={`${field.name}-error`} role="alert" className="mt-1.5 text-sm text-destructive">{errors[field.name]}</p>}
                    </div>;
                })}
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background py-4">
                <Button type="button" variant="outline" disabled={mutation.isPending} onClick={close}>{readonly ? "Close" : "Cancel"}</Button>
                {!readonly && <Button type="submit" disabled={mutation.isPending || Boolean(record && !dirty)}><Save />{mutation.isPending ? "Saving…" : record ? "Save changes" : "Create record"}</Button>}
            </div>
        </form>
    </div>;
}
