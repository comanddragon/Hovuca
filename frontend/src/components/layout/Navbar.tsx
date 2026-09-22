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
import { BrandIcon, socialLinks } from "@/components/layout/SocialLinks";
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
            { href: "/resources", label: "Documents" },
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
                                : "text-primary hover:bg-muted"
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
                link.cta && "ml-1 bg-brand-plum-deep px-5 text-brand-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-plum",
                isActive
                    ? link.cta ? "bg-brand-plum-deep text-brand-white" : "bg-brand-plum-light text-primary"
                    : link.cta ? "" : "text-primary hover:bg-muted"
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
            { href: "/resources", label: "Resources" },
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
                    "z-50 text-brand-white transition-[width,top,right,background-color,box-shadow] duration-500 ease-out",
                    scrolled
                        ? "fixed right-3 top-3 w-[calc(100%-1.5rem)] rounded-full border border-brand-white/25 bg-primary/78 shadow-[0_16px_48px_var(--brand-shadow-forest)] backdrop-blur-xl xl:w-[940px] 2xl:w-[980px]"
                        : isHome
                            ? "absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,var(--brand-nav-overlay-top)_0%,var(--brand-nav-overlay-mid)_58%,transparent_100%)] pb-6"
                            : "relative inset-x-0 top-0 bg-primary"
                )}
            >
                <nav className={cn("relative mx-auto flex w-full items-center transition-[height,padding] duration-500", scrolled ? "h-16 px-4" : "h-18 px-[clamp(1.5rem,3.8vw,3.75rem)]")} aria-label="Primary navigation">
                    <Link href="/" className={cn("flex shrink-0 items-center text-brand-white drop-shadow-[0_1px_5px_var(--brand-black-45)]", scrolled ? "gap-2" : "gap-3 lg:w-[24.5%] lg:min-w-90")}>
                        <span className={cn("font-extrabold leading-none tracking-[-0.035em] transition-[font-size] duration-500", scrolled ? "text-xl" : "text-[clamp(1.55rem,2.3vw,2.35rem)]")}>HOVUCA</span>
                        <span className={cn("block w-px bg-brand-gold-light shrink-0", scrolled ? "h-6 sm:h-8" : "h-8 sm:h-12")} aria-hidden="true" />
                        <Image src="/Hovuca-croped.webp" alt="" width={40} height={40} className={cn("aspect-square shrink-0 bg-brand-white object-contain", scrolled ? "size-8" : "size-10")} />
                        {!scrolled && <span className="hidden text-[9.5px] font-bold uppercase leading-[1.45] tracking-[0.14em] lg:block">Hope for<br />Vulnerable Children<br />Association</span>}
                    </Link>

                    {scrolled && (
                        <div className="flex items-center gap-1.5 sm:gap-2 max-[350px]:hidden animate-in fade-in zoom-in-95 duration-300">
                            <span className="h-5 sm:h-6 w-px bg-brand-white/20 mx-1 sm:mx-1.5 shrink-0" aria-hidden="true" />
                            {socialLinks.map(({ label, href, platform }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={label}
                                    aria-label={`HOVUCA on ${label} (opens in a new tab)`}
                                    className="group relative inline-flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full border border-brand-white/25 bg-brand-white/10 text-brand-white/90 shadow-[inset_0_1px_1px_var(--brand-white-40),0_2px_8px_var(--brand-black-18)] backdrop-blur-md transition-all duration-200 hover:scale-110 hover:border-brand-white/50 hover:bg-brand-white/20 hover:text-brand-gold-light hover:shadow-[inset_0_1px_1px_var(--brand-white-60),0_4px_14px_var(--brand-black-25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light/70 active:scale-95"
                                >
                                    <BrandIcon platform={platform} className="size-3.5 sm:size-4 transition-transform duration-200 group-hover:scale-110" />
                                </a>
                            ))}
                        </div>
                    )}

                    <div className={cn("ml-auto hidden items-center xl:flex", scrolled ? "gap-5" : "gap-[clamp(1.1rem,2vw,2.2rem)]")}>
                        {visibleLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn("text-[13px] font-semibold text-brand-white drop-shadow-[0_1px_4px_var(--brand-black-62)] transition-colors hover:text-brand-gold-light", pathname.startsWith(link.href) && "text-brand-gold-light")}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/donate"
                            className={cn("inline-flex items-center gap-2 rounded-full bg-brand-coral text-sm font-semibold text-brand-white transition-[height,padding,background-color] hover:bg-brand-coral-dark", scrolled ? "h-10 px-5" : "h-11 px-7")}
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
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-white/30 text-brand-white transition-colors hover:border-brand-gold-light/60 hover:bg-brand-white/10 hover:text-brand-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-light/70"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={12}
                                    className="w-52 rounded-2xl border border-brand-white/25 bg-primary/78 p-2 shadow-[0_16px_48px_var(--brand-shadow-forest)] backdrop-blur-xl"
                                >
                                    {overflowLinks.map((link) => (
                                        <DropdownMenuItem key={link.href} asChild>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "cursor-pointer rounded-md px-3 py-2.5 font-semibold",
                                                    pathname.startsWith(link.href)
                                                        ? "text-brand-gold-light"
                                                        : "text-brand-white"
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
                                className="group/search mr-5.5 inline-flex h-7 w-5.25 items-center justify-center text-brand-white backdrop-blur-[3px] transition-colors hover:text-brand-gold-light"
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
                        className="ml-auto inline-flex h-11 w-11 items-center justify-center border border-brand-white/50 bg-primary/45 text-brand-white backdrop-blur-sm xl:hidden"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </nav>

                {mobileOpen && (
                    <div className="mx-4 border-t border-brand-white/20 bg-primary px-5 py-5 shadow-[0_18px_40px_var(--brand-black-28)] sm:mx-6 xl:hidden">
                        <div className="grid gap-1">
                            {homeLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="border-brand-white/12 px-2 py-3 text-sm font-semibold text-brand-white last:border-b-0 hover:text-brand-gold-light"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/donate"
                                onClick={() => setMobileOpen(false)}
                                className="mt-4 bg-brand-coral px-5 py-3.5 text-center text-sm font-semibold text-brand-white"
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
        <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/95 backdrop-blur-xl">
            <nav className="mx-auto flex h-19 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Logo />
                    <span className="h-8 w-px bg-brand-gold-light shrink-0" aria-hidden="true" />
                    <span className="hidden sm:block">
                        <span className="block font-display text-xl font-extrabold leading-none tracking-[-0.03em] text-primary">HOVUCA</span>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Hope for vulnerable children</span>
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
                                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-brand-error">
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
                        className="xl:hidden text-primary"
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-primary/10 bg-background px-4 pb-5 xl:hidden">
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
