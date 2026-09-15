import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Logo from "./Logo";
const groups = [
    { title: "Our work", links: [["Programs", "/programs"], ["Projects", "/projects"], ["Courses", "/courses"]] },
    { title: "Explore", links: [["About HOVUCA", "/about"], ["Field stories", "/blog"], ["Publications", "/documents"], ["Gallery", "/gallery"], ["Events", "/events"]] },
    { title: "Get involved", links: [["Volunteer", "/volunteers"], ["Donate", "/donate"], ["Contact us", "/contact"]] },
];
export function Footer() {
    return <footer className="bg-[#183b35] text-[#f6f3eb]"><div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 border-b border-[#f6f3eb]/25 py-14 md:flex-row md:items-center md:justify-between"><h2 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">A safer future starts with us.</h2><Link href="/contact" className="inline-flex min-h-12 w-fit shrink-0 items-center gap-6 bg-[#ef886d] px-6 py-4 font-semibold text-[#183b35] hover:bg-[#f39b85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f6f3eb]">Let’s work together <ArrowUpRight aria-hidden="true" className="size-5" /></Link></div>
        <div className="grid gap-12 py-14 lg:grid-cols-[1.3fr_2fr]"><div><Link href="/" className="inline-flex items-center gap-3"><Logo /><span className="font-display text-3xl font-bold">HOVUCA</span></Link><p className="mt-5 max-w-sm leading-7 text-[#f6f3eb]/75">Hope for Vulnerable Children Association. Working for children’s protection, dignity, and opportunity.</p><address className="mt-6 space-y-2 text-sm not-italic leading-6"><a className="block w-fit underline underline-offset-4" href="mailto:contact@hovuca.org">contact@hovuca.org</a><a className="block w-fit underline underline-offset-4" href="tel:+237696230391">+237 696 230 391</a><p className="text-[#f6f3eb]/75">Grande Chefferie Simbock<br />Yaoundé, Cameroon</p></address></div><nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">{groups.map(group => <div key={group.title}><h3 className="font-semibold">{group.title}</h3><ul className="mt-5 space-y-3">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-block py-1 text-sm text-[#f6f3eb]/75 hover:text-white hover:underline hover:underline-offset-4">{label}</Link></li>)}</ul></div>)}</nav></div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-[#f6f3eb]/25 py-6 text-xs leading-6 text-[#f6f3eb]/70"><p>© {new Date().getFullYear()} HOVUCA. All rights reserved.</p><p>For children. With communities.</p></div>
    </div></footer>;
}
