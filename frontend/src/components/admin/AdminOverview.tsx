"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService, adminKeys } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";
import { AdminError, AdminSkeleton } from "./AdminStates";

export function AdminOverview({ reports = false }: { reports?: boolean }) {
    const query = useQuery({ queryKey: adminKeys.overview, queryFn: adminService.overview, staleTime: 30_000 });
    const user = useAuthStore(state => state.user);
    const catalog = useQuery({ queryKey: adminKeys.catalog, queryFn: adminService.catalog, staleTime: 60_000 });
    if (query.isLoading) return <AdminSkeleton />;
    if (query.isError) return <AdminError error={query.error} retry={() => query.refetch()} />;
    if (!query.data) return null;
    const data = query.data;
    const counts = data.counts;
    const days = Array.from({ length: 30 }, (_, index) => {
        const date = new Date(`${data.period_start}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + index);
        const key = date.toISOString().slice(0, 10);
        return { day: key, count: data.daily_donations.find(row => row.day === key)?.count ?? 0 };
    });
    const max = Math.max(1, ...days.map(day => day.count));
    return <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6"><div><h1 className="text-3xl font-semibold tracking-tight text-foreground">{reports ? "Operational reports" : `Welcome back, ${user?.first_name || user?.full_name?.split(" ")[0] || "team"}.`}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{reports ? "Live records and completed donations, with each currency reported separately." : "Keep HOVUCA’s work moving. Review incoming requests, update projects, and publish the next story."}</p></div><div className="flex gap-2"><Button variant="outline" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "animate-spin" : ""} />Refresh</Button>{!reports && <Button asChild><Link href="/admin/blog/new"><Plus />Write an article</Link></Button>}</div></header>
        {!reports && <section aria-labelledby="needs-attention"><h2 id="needs-attention" className="mb-4 text-lg font-semibold">Needs attention</h2><div className="divide-y divide-border border-y border-border">{data.queues.map(queue => <Link key={queue.key} href={`/admin/${queue.key}?${queue.field}=${queue.value}`} className="flex items-center gap-4 py-4 text-sm hover:bg-muted/30"><span className="min-w-10 text-2xl font-semibold tabular-nums text-primary">{queue.count}</span><span className="flex-1 font-medium">{queue.label}</span><ArrowRight className="size-4 text-muted-foreground" /></Link>)}</div></section>}
        <section aria-labelledby="funding-overview"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="funding-overview" className="text-lg font-semibold">Completed donations</h2><p className="mt-1 text-sm text-muted-foreground">{data.period_start} to {data.period_end} · Last 30 days</p></div><Link className="text-sm font-semibold text-primary hover:underline" href="/admin/donations?status=completed">View transactions</Link></div>
            <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Currency</th><th scope="col" className="px-4 py-3 text-right">Amount received</th><th scope="col" className="px-4 py-3 text-right">Transactions</th></tr></thead><tbody className="divide-y divide-border">{data.donation_totals.map(total => <tr key={total.currency}><td className="px-4 py-4 font-medium">{total.currency}</td><td className="px-4 py-4 text-right tabular-nums">{Number(total.amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="px-4 py-4 text-right tabular-nums">{total.count}</td></tr>)}{!data.donation_totals.length && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No completed donations in this period.</td></tr>}</tbody></table></div>
        </section>
        {reports && <section aria-labelledby="donation-volume"><h2 id="donation-volume" className="text-lg font-semibold">Daily donation count</h2><p className="mt-1 text-sm text-muted-foreground">Number of completed transactions. Amounts are listed by currency above.</p><div className="mt-6 flex h-44 items-end gap-1 border-b border-border" role="img" aria-label={days.map(day => `${day.day}: ${day.count}`).join(", ")}>{days.map(day => <div key={day.day} title={`${day.day}: ${day.count} completed donations`} className="flex h-full min-w-0 flex-1 items-end"><div className="w-full bg-primary" style={{ height: `${day.count / max * 100}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{data.period_start}</span><span>{data.period_end}</span></div><details className="mt-4 text-sm"><summary className="cursor-pointer text-primary">View daily counts as a table</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr><th>Date</th><th>Completed donations</th></tr></thead><tbody>{days.map(day => <tr key={day.day} className="border-t border-border"><td className="py-2">{day.day}</td><td>{day.count}</td></tr>)}</tbody></table></div></details></section>}
        <section aria-labelledby="workspace-records"><h2 id="workspace-records" className="mb-4 text-lg font-semibold">Workspace records</h2><div className="grid gap-x-6 sm:grid-cols-2">{Object.entries(counts).map(([key, count]) => <Link href={`/admin/${key}`} key={key} className="flex items-center justify-between border-b border-border py-3 text-sm hover:text-primary"><span className="capitalize">{catalog.data?.find(section => section.key === key)?.title ?? key.replaceAll("-", " ")}</span><span className="font-semibold tabular-nums">{count}</span></Link>)}</div></section>
        {!reports && <section aria-labelledby="recent-activity"><h2 id="recent-activity" className="mb-4 text-lg font-semibold">Your recent changes</h2><div className="divide-y divide-border">{data.recent_activity.map((activity, index) => <div key={`${activity.action_time}-${index}`} className="py-3"><p className="text-sm font-medium">{activity.object_repr}</p><p className="mt-1 text-xs text-muted-foreground">{activity.change_message} · {new Date(activity.action_time).toLocaleString("en-GB")}</p></div>)}{!data.recent_activity.length && <p className="text-sm text-muted-foreground">Changes you make in the admin will appear here.</p>}</div></section>}
    </div>;
}
