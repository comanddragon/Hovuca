"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import {
    Bell,
    BookOpen,
    LayoutDashboard,
    LogOut,
    LogIn,
    Menu,
    User,
    X,
    ChevronDown,
} from "lucide-react";
import { useNotificationStore } from "@/store";
import Logo from "@/components/layout/Logo";

type NavChild = { href: string; label: string };
type NavLink = {
    href: string;
    label: string;
    children?: NavChild[];
    cta?: boolean;
};

const navLinks: NavLink[] = [
    { href: "/about", label: "About" },
    {
        href: "/projects",
        label: "Projects",
    },
    { href: "/programs", label: "Programs" },
    {
        href: "", label: "Resources",
        children: [
            { href: "/blog", label: "Stories & news" },
            { href: "/documents", label: "Documents" },
            { href: "/courses", label: "Courses" },
            { href: "/gallery", label: "Gallery" },

        ],
    },
    {
        href: "", label: "Get involved",
        children: [
            { href: "/donate", label: "Donate" },
            { href: "/contact", label: "Partner with us" },
        ],
    },
    { href: "/contact", label: "Contact" },
    { href: "/donate", label: "Donate", cta: true },
];

// ── Desktop nav item ─────────────────────────────────────────────────────────
function DesktopNavItem({ link, pathname }: { link: NavLink; pathname: string }) {
    const isActive =
        (link.href !== "" && pathname.startsWith(link.href)) ||
        link.children?.some((child) => child.href !== "" && pathname.startsWith(child.href));

    if (link.children?.length) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors outline-none",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-[#35145f] hover:bg-[#f0e8f7]"
                        )}
                    >
                        {link.label}
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 space-y-2">
                    {link.children.map((child) => (
                        <DropdownMenuItem key={child.label} asChild>
                            <Link
                                href={child.href}
                                className={cn(
                                    "flex items-center gap-2 font-semibold",
                                    pathname === child.href && "text-primary font-medium"
                                )}
                            >
                                {child.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (!link.href) {
        return (
            <span className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-display font-medium text-foreground">
                {link.label}
            </span>
        );
    }

    return (
        <Link
            href={link.href}
            className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-all",
                link.cta && "ml-1 bg-[#35145f] px-5 text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#4d2477]",
                isActive
                    ? link.cta ? "bg-[#35145f] text-white" : "bg-[#f0e8f7] text-[#35145f]"
                    : link.cta ? "" : "text-[#35145f] hover:bg-[#f0e8f7]"
            )}
        >
            {link.label}
        </Link>
    );
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const { mutate: logout } = useLogout();
    const unreadCount = useNotificationStore((s) => s.unreadCount);
    const [mobileOpen, setMobileOpen] = useState(false);
    // ✅ track by label, not href — fixes the "all empty-href dropdowns open together" bug
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

    return (
        <header className="sticky top-0 z-50 border-b border-[#35145f]/10 bg-[#fffaf3]/95 backdrop-blur-xl">
            <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Logo />
                    <span className="hidden sm:block">
                        <span className="block font-display text-xl font-extrabold leading-none tracking-[-0.03em] text-[#35145f]">HOVUCA</span>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[#755d82]">Hope for vulnerable children</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-0.5 xl:flex">
                    {navLinks.map((link) => (
                        <DesktopNavItem key={link.label} link={link} pathname={pathname} />
                    ))}
                </div>

                {/* Right side */}
                <div className="font-display flex items-center gap-2">

                    {isAuthenticated && user ? (
                        <>
                            <Link href="/dashboard/notifications">
                                <Button variant="ghost" size="icon" className="text-foreground relative">
                                    <Bell className="h-4 w-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-red-600">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={getAvatarUrl(user.avatar) ?? undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuLabel>
                                        <p className="font-semibold">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/courses"><BookOpen className="mr-2 h-4 w-4" />My Courses</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={async () => {
                                            logout();
                                            router.push("/");
                                            router.refresh();
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Switch Accounts</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="hidden items-center gap-2 xl:flex">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/login">Sign in</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/register">Get started</Link>
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="xl:hidden text-[#35145f]"
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-[#35145f]/10 bg-[#fffaf3] px-4 pb-5 xl:hidden">
                    <div className="flex flex-col gap-1 pt-2">
                        {navLinks.map(({ href, label, children }) => {
                            const isActive = href !== "" && pathname.startsWith(href);
                            // ✅ track by label, not href
                            const isExpanded = mobileExpanded === label;

                            if (!children?.length) {
                                return (
                                    <Link
                                        key={label}
                                        href={href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-display font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {label}
                                    </Link>
                                );
                            }

                            return (
                                <div key={label}>
                                    <button
                                        // ✅ toggle by label, not href
                                        onClick={() => setMobileExpanded(isExpanded ? null : label)}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-display font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {label}
                                        <ChevronDown
                                            className={cn(
                                                "ml-auto h-4 w-4 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {isExpanded && (
                                        <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                                            {children.map((child) => (
                                                <Link
                                                    key={child.label}
                                                    href={child.href}
                                                    onClick={() => {
                                                        setMobileOpen(false);
                                                        setMobileExpanded(null);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-display transition-colors",
                                                        pathname === child.href
                                                            ? "text-primary font-medium"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!isAuthenticated && (
                            <div className="mt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                    <Link href="/login">Sign in</Link>
                                </Button>
                                <Button size="sm" className="flex-1" asChild>
                                    <Link href="/register">Get started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
