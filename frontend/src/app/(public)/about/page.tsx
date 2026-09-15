import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
export const metadata: Metadata = { title: "About", description: "Learn about HOVUCA’s mission, vision, principles, and work for vulnerable children in Cameroon." };
const principles = [
    {
        "title": "Best Interest of the Child",
        "text": "In all actions concerning children, the best interests of the child shall be a primary consideration."
    },
    {
        "title": "Do No Harm",
        "text": "In all our activities, decisions made concerning children, their families, and the community we will seek to avoid causing harm."
    },
    {
        "title": "Gender Equality",
        "text": "Though we may have specific projects for girls because of their high vulnerability, most of our projects involve both boys and girls."
    },
    {
        "title": "Integrity",
        "text": "HOVUCA endeavors to be transparent, accountable, and responsible in all its activities with youth groups, community heads, staff, volunteers and partners."
    },
    {
        "title": "Transparency",
        "text": "Honestly tell our success story and failures regardless of consequence."
    },
    {
        "title": "Non Discrimination",
        "text": "At HOVUCA, all children and young people regardless of class, race, creed, religion, sex, disability, ethnic origin or sexual orientation have a right to protection."
    },
    {
        "title": "Participation & Sustainability",
        "text": "We believe that children's participation in the initiation, design and implementation of projects that concern them will give them ownership and hence sustainability."
    },
    {
        "title": "Partnership",
        "text": "HOVUCA holds that success comes with developing partnerships with related organizations and government entities."
    },
    {
        "title": "Accountability",
        "text": "Our structure and system of management is credible and linked directly to our ability to take responsibility for our actions."
    }
];
const objectives = [
    "Increase access to children's basic and developmental rights.",
    "Improve the health of HIV/AIDS infected children and other vulnerable children.",
    "Care and support street, neglected, and abandoned children with basic non-food and food items and shelter.",
    "Increase awareness among children and community members on the rights of the child.",
    "Empower women to care and support vulnerable children with emotional and physical needs.",
    "Network and share information with development actors locally, nationally and internationally.",
    "Advocate for the rights of children and empower girls and adolescent girls to uphold their rights."
];
export default function AboutPage() {
    return <div className="bg-[#f6f3eb] text-[#183b35]">
        <section className="grid lg:grid-cols-[1.1fr_1fr]"><div className="bg-[#183b35] px-6 py-20 text-[#f6f3eb] sm:px-12 lg:pl-[max(3rem,calc((100vw-1280px)/2+1.5rem))]"><h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-7xl">Every child deserves protection. And possibility.</h1><p className="mt-8 max-w-lg text-lg leading-8 text-[#f6f3eb]/80">We are Hope for Vulnerable Children Association. We work with children, families, and communities to protect rights and open opportunities.</p><a href="#mission" className="mt-8 inline-flex min-h-12 items-center gap-3 border-b border-[#f6f3eb]/60 font-semibold">Discover what drives us <ArrowDown aria-hidden="true" className="size-4" /></a></div><div className="relative min-h-96"><Image src="/heros/hero1.webp" alt="Community gathering in support of children" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></section>
        <section id="mission" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 md:py-24"><h2 className="max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">Research, education, advocacy, and community partnership.</h2><div className="mt-12 grid gap-10 md:grid-cols-2"><div className="border-t border-[#183b35]/25 pt-6"><h3 className="font-display text-3xl font-bold">Our mission</h3><p className="mt-5 text-lg leading-8 text-[#53645f]">Our mission is to use research, education, advocacy and community partnerships to enhance child protection systems and facilitate vulnerable children’s access to basic facilities.</p><p className="mt-5 leading-7 text-[#53645f]">We are committed to breaking barriers for the girl child, enabling equal rights, equal opportunities, and equal standing in every community we serve.</p></div><div className="border-t border-[#183b35]/25 pt-6"><h3 className="font-display text-3xl font-bold">Our vision</h3><p className="mt-5 text-lg leading-8 text-[#53645f]">Our vision is to create an environment where children, especially girls and those in rural communities, have the right to protection, survival, development, and a voice.</p><p className="mt-5 leading-7 text-[#53645f]">We imagine a world where every child grows up with dignity, safety, and the tools they need to become the changemakers of tomorrow.</p></div></div></section>
        <section id="principles" className="bg-[#e7ebdf]"><div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1fr_1.5fr]"><div><h2 className="font-display text-4xl font-bold sm:text-5xl">Our principles</h2><p className="mt-5 max-w-md leading-7 text-[#53645f]">The commitments that guide how we work, make decisions, and take responsibility for our actions.</p></div><div className="border-t border-[#183b35]/25">{principles.map(principle => <details key={principle.title} className="group border-b border-[#183b35]/25 py-5"><summary className="cursor-pointer font-display text-xl font-bold leading-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">{principle.title}</summary><p className="mt-4 pr-6 leading-7 text-[#53645f]">{principle.text}</p></details>)}</div></div></section>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1fr_1.5fr]"><div><h2 className="font-display text-4xl font-bold sm:text-5xl">What we work towards</h2><p className="mt-5 max-w-md leading-7 text-[#53645f]">Our objectives connect children’s rights with practical care, stronger communities, and shared action.</p><Link href="/projects" className="mt-6 inline-flex min-h-12 items-center gap-3 border-b border-[#183b35] font-semibold">Explore our projects <ArrowRight aria-hidden="true" className="size-4" /></Link></div><ul className="border-t border-[#183b35]/25">{objectives.map(objective => <li key={objective} className="border-b border-[#183b35]/25 py-5 text-lg leading-8">{objective}</li>)}</ul></section>
        <section className="mx-auto max-w-7xl px-6 pb-20"><div className="border-t border-[#183b35]/25 pt-10"><h2 className="font-display text-4xl font-bold">Help us protect every child.</h2><p className="mt-5 max-w-xl leading-7 text-[#53645f]">Join our community of partners, volunteers, and advocates working to create a safer, fairer world for children.</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/volunteers" className="inline-flex min-h-12 items-center bg-[#183b35] px-6 py-3 font-semibold text-white hover:bg-[#102c28]">Become a volunteer</Link><Link href="/contact" className="inline-flex min-h-12 items-center border border-[#183b35] px-6 py-3 font-semibold hover:bg-[#e7ebdf]">Partner with us</Link></div></div></section>
    </div>;
}
