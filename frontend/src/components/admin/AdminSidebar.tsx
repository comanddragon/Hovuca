"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, FolderKanban, HandCoins, LayoutDashboard, Menu, Newspaper, Users, Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminService, adminKeys } from "@/services/admin.service";

const icons: Record<string, typeof Users> = { Impact: FolderKanban, Content: Newspaper, Community: CalendarDays, People: Users, Funding: HandCoins, Learning: BookOpen, Organization: Building2 };

export function AdminSidebar() {
    const pathname = usePathname();
    const query = useQuery({ queryKey: adminKeys.catalog, queryFn: adminService.catalog, staleTime: 60_000 });
    const groups = ["Impact", "Content", "Community", "People", "Funding", "Learning", "Organization"];
    const navLink = (href: string, title: string, Icon: typeof Users) => {
        const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring", active ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="size-4 shrink-0" />{title}</Link>;
    };
    const navigation = <nav aria-label="Admin navigation" className="space-y-4">
        <div>{navLink("/admin", "Overview", LayoutDashboard)}{navLink("/admin/analytics", "Reports", BarChart3)}</div>
        {groups.map(group => <details key={group} open={group === "Content" || query.data?.some(section => section.group === group && pathname === `/admin/${section.key}`)} className="border-t border-border pt-3"><summary className="flex cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-foreground">{group}<ChevronDown className="size-4" /></summary><div className="mt-2">{group === "Content" && navLink("/admin/blog", "Articles", Newspaper)}{query.data?.filter(section => section.group === group).map(section => navLink(`/admin/${section.key}`, section.title, icons[group] ?? Users))}</div></details>)}
        {query.isLoading && <p role="status" className="px-3 text-xs text-muted-foreground">Loading sections…</p>}
        {query.isError && <div role="alert" className="px-3 text-xs text-destructive">Sections could not load. <button className="underline" onClick={() => query.refetch()}>Retry</button></div>}
    </nav>;
    return <aside className="w-full shrink-0 md:w-60">
        <details className="rounded-lg border border-border bg-card p-4 md:hidden"><summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><Menu className="size-4" />Admin sections</summary><div className="mt-4">{navigation}</div></details>
        <div className="sticky top-6 hidden max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-lg border border-border bg-card p-3 md:block">{navigation}</div>
    </aside>;
}
