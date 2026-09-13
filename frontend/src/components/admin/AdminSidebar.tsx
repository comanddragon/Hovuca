"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    FolderKanban,
    LayoutDashboard,
    Newspaper,
    Users,
} from "lucide-react";

interface AdminNavItem {
    href: string;
    label: string;
    icon: typeof Newspaper;
}

interface AdminNavSection {
    title: string;
    items: AdminNavItem[];
}

// Add further sections here as other admin areas are built — the sidebar
// itself doesn't need to change shape to support them.
const sections: AdminNavSection[] = [
    {
        title: "Workspace",
        items: [
            { href: "/admin", label: "Overview", icon: LayoutDashboard },
        ],
    },
    {
        title: "Content",
        items: [
            { href: "/admin/blog", label: "Articles", icon: Newspaper },
            { href: "/admin/programs", label: "Programs", icon: FolderKanban },
        ],
    },
    {
        title: "Operations",
        items: [
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-60 shrink-0 hidden md:block">
            <div className="sticky top-20 space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="space-y-1 rounded-xl border border-border bg-card p-3"
                    >
                        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {section.title}
                        </p>
                        {section.items.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>
        </aside>
    );
}
