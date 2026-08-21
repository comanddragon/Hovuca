"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  BarChart3, Bell, BookOpen, ClipboardList,
  Heart, LayoutDashboard, Settings, Users, Target, User,
} from "lucide-react";

const allLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "staff", "volunteer", "student", "donor"] },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen, roles: ["student", "volunteer", "staff", "admin"] },
  { href: "/dashboard/tasks", label: "My Tasks", icon: ClipboardList, roles: ["volunteer", "staff", "admin"] },
  { href: "/dashboard/donations", label: "My Donations", icon: Heart, roles: ["donor", "admin", "staff"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["admin", "staff", "volunteer", "student", "donor"] },
  { href: "/profile", label: "Profile", icon: User, roles: ["admin", "staff", "volunteer", "student", "donor"] },
  // Admin only
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["admin", "staff"] },
  { href: "/dashboard/programs", label: "Programs", icon: Target, roles: ["admin", "staff"] },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role ?? "student";

  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="w-60 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-1 rounded-xl border border-border bg-card p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
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
    </aside>
  );
}
