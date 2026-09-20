"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
import { authPath } from "@/lib/auth-return";

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
    { href: "/courses", label: "Courses" },
    {
        href: "", label: "Resources",
        children: [
            { href: "/blog", label: "Stories & news" },
            { href: "/documents", label: "Documents" },
            { href: "/gallery", label: "Gallery" },

        ],
    },
    {
        href: "", label: "Get involved",
        children: [
            { href: "/volunteers", label: "Volunteer with us" },
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
                                : "text-[var(--brand-plum-deep)] hover:bg-[var(--brand-plum-light)]"
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
                link.cta && "ml-1 bg-[var(--brand-plum-deep)] px-5 text-white shadow-sm hover:-translate-y-0.5 hover:bg-[var(--brand-plum)]",
                isActive
                    ? link.cta ? "bg-[var(--brand-plum-deep)] text-white" : "bg-[var(--brand-plum-light)] text-[var(--brand-plum-deep)]"
                    : link.cta ? "" : "text-[var(--brand-plum-deep)] hover:bg-[var(--brand-plum-light)]"
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
    const [scrolled, setScrolled] = useState(false);
    // ✅ track by label, not href — fixes the "all empty-href dropdowns open together" bug
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

    useEffect(() => {
        const updateNavbar = () => setScrolled(window.scrollY > 96);
        updateNavbar();
        window.addEventListener("scroll", updateNavbar, { passive: true });
        return () => window.removeEventListener("scroll", updateNavbar);
    }, []);

    if (pathname) {
        const isHome = pathname === "/";
        const homeLinks = [
            { href: "/about", label: "About" },
            { href: "/projects", label: "Our impact" },
            { href: "/blog", label: "Field stories" },
            { href: "/documents", label: "Publications" },
            { href: "/courses", label: "Courses" },
            { href: "/volunteers", label: "Get involved" },
            { href: "/contact", label: "Contact" },
        ];
        const visibleLinks = scrolled ? homeLinks.slice(0, 4) : homeLinks;
        const overflowLinks = homeLinks.slice(4);

        return (
            <>
            <header
                className={cn(
                    "z-50 text-white transition-[width,top,right,background-color,box-shadow] duration-500 ease-out",
                    scrolled
                        ? "fixed right-3 top-3 w-[calc(100%-1.5rem)] rounded-full border border-white/25 bg-[var(--brand-forest)]/78 shadow-[0_16px_48px_var(--brand-shadow-forest)] backdrop-blur-xl xl:w-220"
                        : isHome
                            ? "absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,var(--brand-nav-overlay-top)_0%,var(--brand-nav-overlay-mid)_58%,transparent_100%)] pb-6"
                            : "relative inset-x-0 top-0 bg-[var(--brand-forest)]"
                )}
            >
                <nav className={cn("relative mx-auto flex w-full items-center transition-[height,padding] duration-500", scrolled ? "h-16 px-4" : "h-18 px-[clamp(1.5rem,3.8vw,3.75rem)]")} aria-label="Primary navigation">
                    <Link href="/" className={cn("flex shrink-0 items-center text-white drop-shadow-[0_1px_5px_var(--brand-black-45)]", scrolled ? "gap-2" : "gap-3 lg:w-[24.5%] lg:min-w-90")}>
                        <span className={cn("font-extrabold leading-none tracking-[-0.035em] transition-[font-size] duration-500", scrolled ? "text-xl" : "text-[clamp(1.55rem,2.3vw,2.35rem)]")}>HOVUCA</span>
                        <span className={cn("hidden w-px bg-[var(--brand-gold-light)] lg:block", scrolled ? "h-8" : "h-12")} aria-hidden="true" />
                        <Image src="/Hovuca-croped.webp" alt="" width={40} height={40} className={cn("aspect-square shrink-0 bg-white object-contain", scrolled ? "size-8" : "size-10")} />
                        {!scrolled && <span className="hidden text-[9.5px] font-bold uppercase leading-[1.45] tracking-[0.14em] lg:block">Hope for<br />Vulnerable Children<br />Association</span>}
                    </Link>

                    <div className={cn("ml-auto hidden items-center xl:flex", scrolled ? "gap-5" : "gap-[clamp(1.1rem,2vw,2.2rem)]")}>
                        {visibleLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn("text-[13px] font-semibold text-white drop-shadow-[0_1px_4px_var(--brand-black-62)] transition-colors hover:text-[var(--brand-gold-light)]", pathname.startsWith(link.href) && "text-[var(--brand-gold-light)]")}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/donate"
                            className={cn("inline-flex items-center gap-2 rounded-full bg-[var(--brand-coral)] text-sm font-semibold text-white transition-[height,padding,background-color] hover:bg-[var(--brand-coral-hover)]", scrolled ? "h-10 px-5" : "h-11 px-7")}
                        >
                            Donate
                           <Image src="/hands-holding-heart.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
                        </Link>

                        {scrolled && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="More navigation"
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-[var(--brand-gold-light)]/60 hover:bg-white/10 hover:text-[var(--brand-gold-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold-light)]/70"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={12}
                                    className="w-52 rounded-2xl border border-white/25 bg-[var(--brand-forest)]/78 p-2 shadow-[0_16px_48px_var(--brand-shadow-forest)] backdrop-blur-xl"
                                >
                                    {overflowLinks.map((link) => (
                                        <DropdownMenuItem key={link.href} asChild>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "cursor-pointer rounded-md px-3 py-2.5 font-semibold",
                                                    pathname.startsWith(link.href)
                                                        ? "text-[var(--brand-gold-light)]"
                                                        : "text-white"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {!scrolled && (
                            <Link
                                href="/blog"
                                aria-label="Search HOVUCA stories"
                                className="group/search mr-5.5 inline-flex h-7 w-5.25 items-center justify-center text-white backdrop-blur-[3px] transition-colors hover:text-[var(--brand-gold-light)]"
                            >
                                <span className="relative block h-6 w-6" aria-hidden="true">
                                    <span className="absolute left-px top-px h-4.25 w-4.25 rounded-full border-2 border-current" />
                                    <span className="absolute left-3.75 top-4 h-0.5 w-1.75 origin-left rotate-45 rounded-full bg-current" />
                                </span>
                            </Link>
                        )}
                    </div>

                    <button
                        type="button"
                        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((open) => !open)}
                        className="ml-auto inline-flex h-11 w-11 items-center justify-center border border-white/50 bg-[var(--brand-forest)]/45 text-white backdrop-blur-sm xl:hidden"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </nav>

                {mobileOpen && (
                    <div className="mx-4 border-t border-white/20 bg-[var(--brand-forest)] px-5 py-5 shadow-[0_18px_40px_var(--brand-black-28)] sm:mx-6 xl:hidden">
                        <div className="grid gap-1">
                            {homeLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="border-white/12 px-2 py-3 text-sm font-semibold text-white last:border-b-0 hover:text-[var(--brand-gold-light)]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/donate"
                                onClick={() => setMobileOpen(false)}
                                className="mt-4 bg-[var(--brand-coral)] px-5 py-3.5 text-center text-sm font-semibold text-white"
                            >
                                Donate
                            </Link>
                        </div>
                    </div>
                )}
            </header>
            {!isHome && scrolled && <div className="h-18" aria-hidden="true" />}
            </>
        );
    }

    return (
        <header className="sticky top-0 z-50 border-b border-[var(--brand-plum-deep)]/10 bg-[var(--brand-cream)]/95 backdrop-blur-xl">
            <nav className="mx-auto flex h-19 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Logo />
                    <span className="hidden sm:block">
                        <span className="block font-display text-xl font-extrabold leading-none tracking-[-0.03em] text-[var(--brand-plum-deep)]">HOVUCA</span>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--brand-plum-muted)]">Hope for vulnerable children</span>
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
                                        className="text-destructive"
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
                                        <Link href={authPath("/login", pathname)}><LogIn className="mr-2 h-4 w-4" />Switch Accounts</Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="hidden items-center gap-2 xl:flex">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={authPath("/login", pathname)}>Sign in</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href={authPath("/register", pathname)}>Get started</Link>
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="xl:hidden text-[var(--brand-plum-deep)]"
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-[var(--brand-plum-deep)]/10 bg-[var(--brand-cream)] px-4 pb-5 xl:hidden">
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
                                    <Link href={authPath("/login", pathname)}>Sign in</Link>
                                </Button>
                                <Button size="sm" className="flex-1" asChild>
                                    <Link href={authPath("/register", pathname)}>Get started</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
