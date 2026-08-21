import Link from "next/link";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/layout/Logo";

const links = {
    Platform: [
        { label: "Programs", href: "/programs" },
        { label: "Courses", href: "/courses" },
        { label: "Blog", href: "/blog" },
        { label: "Donate", href: "/donate" },
    ],
    Organization: [
        { label: "About Us", href: "/about" },
        { label: "Our Team", href: "/team" },
        { label: "Volunteers", href: "/volunteers" },
        { label: "Contact", href: "/contact" },
    ],
    Legal: [
        { label: "Legal Status", href: "/privacy" },
        { label: "Policy", href: "/policy" },
    ],
};

export function Footer() {
    return (
        <>
            <div className="w-full overflow-hidden leading-none -mt-28 md:-mt-36 relative z-10">
                <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-28 md:h-36 block">
                    <path
                        d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1350,20 1440,40 L1440,80 L0,80 Z"
                        className="fill-muted"
                    />
                </svg>
            </div>
            <footer className="border-t-0 border-border bg-muted pt-24">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Brand */}
                        <div className="space-y-4 text-foreground">
                            <Link href="/" className="flex items-center gap-2">
                                <Logo/>
                                <span className="font-display text-xl font-semibold">Hovuca</span>
                            </Link>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Empowering communities through education, meaningful programs, and collective action.
                            </p>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>hovuca@contact.org</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>+237 (696) 23-0391</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>Yaoundé, Cameroon</span>
                                </div>
                            </div>
                        </div>

                        {/* Links */}
                        {Object.entries(links).map(([section, items]) => (
                            <div key={section}>
                                <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase text-foreground">
                                    {section}
                                </h3>
                                <ul className="space-y-2">
                                    {items.map(({ label, href }) => (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Hope for Vulnerable Children Association. All rights reserved.
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for our Cameroonian communities
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}