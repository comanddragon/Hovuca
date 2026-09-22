import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
import { SocialLinks } from "./SocialLinks";
import { CommunityPattern } from "@/components/illustrations/CommunityPattern";

const groups = [
    { title: "Our work", links: [["Programs", "/programs"], ["Projects", "/projects"], ["Courses", "/courses"]] },
    { title: "Explore", links: [["About HOVUCA", "/about"], ["Field stories", "/blog"], ["Publications", "/resources"], ["Gallery", "/gallery"], ["Events", "/events"]] },
    { title: "Get involved", links: [["Volunteer", "/volunteers"], ["Donate", "/donate"], ["Contact us", "/contact"]] },
    { title: "Your account", links: [["Sign in", "/login"], ["Create an account", "/register"], ["Reset password", "/forgot-password"]] },
];
export function Footer() {
    return <footer className="relative isolate overflow-hidden bg-primary text-primary-foreground"><CommunityPattern className="pointer-events-none absolute -right-24 -top-60 hidden w-[112.5rem] text-primary-foreground/15 lg:block" /><div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 border-b border-primary-foreground/25 py-12 md:flex-row md:items-center md:justify-between"><h2 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">A safer future starts with us.</h2><Link href="/contact" className="group inline-flex min-h-11 w-fit shrink-0 items-center gap-4 rounded-full bg-brand-coral-light px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-brand-coral-pale focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"><span>Let’s work together</span><ArrowUpRight aria-hidden="true" className="size-5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:translate-x-1 motion-safe:group-hover:-translate-y-1 motion-safe:group-focus-visible:translate-x-1 motion-safe:group-focus-visible:-translate-y-1" /></Link></div>
        <div className="grid gap-12 py-12 lg:grid-cols-[1.3fr_2fr]"><div><Link href="/" className="inline-flex items-center gap-3"><Logo /><span className="h-8 w-px bg-brand-gold-light shrink-0" aria-hidden="true" /><span className="font-display text-3xl font-bold">HOVUCA</span></Link><p className="mt-5 max-w-sm leading-7 text-primary-foreground/75">Hope for Vulnerable Children Association.<br/><br/>Anyone who does anything to help a child is a Hero to us.</p><address className="mt-6 space-y-2 text-sm not-italic leading-6"><a className="block w-fit underline underline-offset-4" href="mailto:contact@hovuca.org">contact@hovuca.org</a><a className="block w-fit underline underline-offset-4" href="tel:+237696230391">+237 696 230 391</a><p className="text-primary-foreground/75">Grande Chefferie Simbock<br />Yaoundé, Cameroon</p></address><nav aria-label="Social media" className="mt-7"><SocialLinks /></nav></div><nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">{groups.map(group => <div key={group.title}><h3 className="font-semibold">{group.title}</h3><ul className="mt-5 space-y-3">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-block py-1 text-sm text-primary-foreground/75 hover:text-brand-white hover:underline hover:underline-offset-4">{label}</Link></li>)}</ul></div>)}</nav></div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-primary-foreground/25 py-6 text-xs leading-6 text-primary-foreground/70"><p>© {new Date().getFullYear()} HOVUCA. All rights reserved.</p><p>For children. With communities.</p></div>
    </div></footer>;
}
