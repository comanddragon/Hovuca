import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    FileText,
    Handshake,
    Heart,
    Mail,
    Phone,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react";
import DonationMethods from "@/components/donations/DonationMethods";
import DonationFaq from "@/components/donations/DonationFaq";
import DonorCarousel from "@/components/home/DonorCarousel";
import { constructMetadata, getBreadcrumbSchema, SITE_CONFIG, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { CommunityPattern } from "@/components/illustrations/CommunityPattern";

export const metadata: Metadata = constructMetadata({
    title: "Donate & Support Our Work | HOVUCA Cameroon",
    description:
        "Support HOVUCA's community-led work in Cameroon. Give by direct bank wire transfer (UBA), MTN MoMo, Orange Money, or PayPal to fund education, menstrual dignity, and child protection.",
    path: "/donate",
    keywords: [
        "donate to HOVUCA",
        "Cameroon charity donation",
        "support vulnerable children Africa",
        "give to Cameroon NGO",
        "PayPal donation Cameroon",
        "MTN MoMo charity Cameroon",
        "Orange Money donation",
        "UBA Cameroon bank transfer charity",
        "girls education Cameroon",
        "menstrual hygiene donation",
    ],
});

const impactStats = [
    { value: "2,500+", label: "Children & Girls Supported", sub: "across Cameroon" },
    { value: "15+", label: "Communities Reached", sub: "grassroots field presence" },
    { value: "85%+", label: "Direct Field Allocation", sub: "to frontline programs" },
    { value: "10+ Yrs", label: "Community Leadership", sub: "registered Cameroon NGO" },
];

const pillars = [
    {
        title: "Child Protection & Education",
        desc: "School enrollment support, textbooks, safe learning spaces, and community safeguarding committees.",
    },
    {
        title: "Girls' Dignity & SRHR",
        desc: "Reusable sanitary pad kits, menstrual health education, and life skills through the Strong Girls Corner.",
    },
    {
        title: "Vocational Skills & Livelihoods",
        desc: "Tailoring, computer literacy, and micro-business apprenticeships for vulnerable adolescent girls and youth.",
    },
    {
        title: "Community Health & Nutrition",
        desc: "Rural mobile health screenings, basic medical kits, and comprehensive sexuality education.",
    },
];

export default function DonatePage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Donate", path: "/donate" },
    ]);

    const donateSchema = {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        agent: {
            "@type": "NGO",
            name: SITE_CONFIG.name,
            url: SITE_URL,
        },
        recipient: {
            "@type": "NGO",
            name: SITE_CONFIG.legalName,
            url: SITE_URL,
            address: {
                "@type": "PostalAddress",
                streetAddress: SITE_CONFIG.address.streetAddress,
                addressLocality: SITE_CONFIG.address.addressLocality,
                addressCountry: SITE_CONFIG.address.addressCountry,
            },
        },
        name: "Donate to HOVUCA",
        description: "Support vulnerable children, adolescent girls, young people, and communities across Cameroon.",
    };

    return (
        <div className="bg-background text-foreground">
            <JsonLd data={breadcrumbs} />
            <JsonLd data={donateSchema} />

            {/* ─── Hero Section ─── */}
            <section aria-labelledby="donate-hero-heading" className="relative overflow-hidden border-b border-primary/10">
                <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-1280px)/2))] lg:pr-12">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-coral/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-coral-deep">
                            <Sparkles aria-hidden="true" className="size-3.5 text-brand-coral" />
                            <span>Direct & Transparent Impact</span>
                        </div>

                        <h1
                            id="donate-hero-heading"
                            className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-[-0.02em] sm:text-5xl lg:text-6xl text-primary"
                        >
                            Give today.<br />
                            Build possibilities that last.
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                            Every vulnerable child deserves safety, education, and dignity. Your support powers community-rooted programs in Cameroon—keeping girls in school, protecting orphans, and equipping youth with life-changing vocational skills.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <a
                                href="#giving-section"
                                className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-brand-coral px-7 py-3.5 font-display text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-coral-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                            >
                                <span>Choose your donation</span>
                                <ArrowRight aria-hidden="true" className="size-4" />
                            </a>
                            <a
                                href="#transparency"
                                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary/20 px-6 py-3.5 font-display text-sm font-semibold text-primary transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <span>How funds are used</span>
                            </a>
                        </div>

                        {/* Quick Trust Checks */}
                        <div className="mt-10 grid grid-cols-2 gap-3 border-t border-primary/10 pt-6 text-xs text-muted-foreground sm:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck aria-hidden="true" className="size-4 text-green-700 dark:text-green-400" />
                                <span>Registered NGO</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 aria-hidden="true" className="size-4 text-green-700 dark:text-green-400" />
                                <span>Tax Receipts Issued</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 aria-hidden="true" className="size-4 text-green-700 dark:text-green-400" />
                                <span>100% Impact Stewardship</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-80 sm:min-h-[460px] lg:min-h-full">
                        <Image
                            src="/assets/plates/program-photo.webp"
                            alt="Participants in a HOVUCA community development activity in Cameroon"
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
                        <CommunityPattern className="pointer-events-none absolute bottom-6 left-6 w-40 text-white/80 sm:w-52" />
                    </div>
                </div>

                {/* Impact Metrics Banner */}
                <div className="border-t border-primary/10 bg-primary/5 py-8">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 sm:px-10 lg:grid-cols-4">
                        {impactStats.map((stat) => (
                            <div key={stat.label} className="border-l-2 border-brand-coral pl-4">
                                <p className="font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                                    {stat.value}
                                </p>
                                <p className="text-xs font-bold text-foreground sm:text-sm">{stat.label}</p>
                                <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Main Giving Section ─── */}
            <section
                id="giving-section"
                aria-labelledby="giving-heading"
                className="mx-auto max-w-7xl scroll-mt-20 px-6 py-16 sm:px-10 lg:py-24"
            >
                <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
                    {/* Left Column: Why Your Donation Matters */}
                    <div className="space-y-8">
                        <div>
                            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-coral">
                                <span className="h-px w-8 bg-brand-coral" aria-hidden="true" />
                                Community-Led Change
                            </p>
                            <h2
                                id="giving-heading"
                                className="mt-3 font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl text-primary"
                            >
                                Your generosity turns compassion into concrete action.
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                Unlike top-down aid models, HOVUCA is founded and led by community advocates in Cameroon. We work directly with village leaders, schools, and families to design lasting interventions.
                            </p>
                        </div>

                        {/* 4 Pillars */}
                        <div className="space-y-4">
                            <h3 className="font-display text-base font-bold text-foreground">
                                Where your donation goes:
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {pillars.map((pillar) => (
                                    <div
                                        key={pillar.title}
                                        className="rounded-xl border border-primary/15 bg-card p-4 transition-all hover:border-primary/30"
                                    >
                                        <p className="font-display text-sm font-bold text-primary">{pillar.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pillar.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Beneficiary Spotlight Quote */}
                        <div className="rounded-2xl border border-brand-gold/30 bg-brand-mint-surface/60 p-6">
                            <Heart aria-hidden="true" className="size-6 fill-brand-coral text-brand-coral" />
                            <blockquote className="mt-3 text-sm italic leading-relaxed text-primary">
                                &ldquo;Before the Strong Girls Corner, I lacked menstrual products and was forced to miss classes every month. HOVUCA provided washable pads and health guidance. I stayed in school, completed my exams, and now mentor younger girls in my village.&rdquo;
                            </blockquote>
                            <div className="mt-4 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-primary">Mesline L.</span>
                                    <span className="text-muted-foreground"> — Youth Ambassador & Program Beneficiary</span>
                                </div>
                                <span className="rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                                    Cameroon
                                </span>
                            </div>
                        </div>

                        {/* Contact Assist */}
                        <div className="rounded-xl border border-primary/15 bg-background p-5 text-xs text-muted-foreground">
                            <p className="font-bold text-foreground">Questions or custom donation arrangements?</p>
                            <p className="mt-1">
                                Our finance and partnerships team is on hand to assist with international wire instructions, corporate matching, or formal invoices.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-4 text-primary font-semibold">
                                <a href="mailto:contact@hovuca.org" className="inline-flex items-center gap-1.5 hover:underline">
                                    <Mail aria-hidden="true" className="size-3.5" />
                                    <span>contact@hovuca.org</span>
                                </a>
                                <a href="tel:+237696230391" className="inline-flex items-center gap-1.5 hover:underline">
                                    <Phone aria-hidden="true" className="size-3.5" />
                                    <span>+237 696 230 391</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Giving Suite */}
                    <div>
                        <DonationMethods />
                    </div>
                </div>
            </section>

            {/* ─── Financial Transparency & Allocation ─── */}
            <section
                id="transparency"
                aria-labelledby="transparency-heading"
                className="border-y border-primary/10 bg-primary/5 py-16 sm:py-20"
            >
                <div className="mx-auto max-w-7xl px-6 sm:px-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-coral">
                            Stewardship & Governance
                        </p>
                        <h2
                            id="transparency-heading"
                            className="mt-3 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl"
                        >
                            100% Commitment to Financial Accountability
                        </h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            We believe our donors and communities deserve absolute clarity. Every donation is stewarded with maximum efficiency so your gift delivers maximum field impact.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-3">
                        <div className="rounded-2xl border border-primary/15 bg-background p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-4xl font-extrabold text-brand-coral">85%</span>
                                <span className="rounded-full bg-brand-coral/10 px-2.5 py-0.5 text-xs font-bold text-brand-coral">
                                    Frontline Programs
                                </span>
                            </div>
                            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                                Direct Field Programs
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Directly funds school kits, menstrual pads, vocational workshops, health outreach supplies, and child protection casework.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-primary/15 bg-background p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-4xl font-extrabold text-primary">10%</span>
                                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                    Field Logistics
                                </span>
                            </div>
                            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                                Monitoring & Safeguarding
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Transport into remote rural communities, rigorous child safeguarding monitoring, community volunteer mobilization, and safety.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-primary/15 bg-background p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-4xl font-extrabold text-muted-foreground">5%</span>
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                                    Administration
                                </span>
                            </div>
                            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                                Governance & Reporting
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                Annual external financial audits, statutory legal compliance, regulatory filing, and transparent donor impact reports.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center">
                        <Link
                            href="/resources"
                            className="inline-flex items-center gap-2 font-display text-sm font-bold text-primary underline underline-offset-4 hover:text-brand-coral"
                        >
                            <FileText aria-hidden="true" className="size-4" />
                            <span>View our published annual reports & audit documents</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Institutional Partners & Trust ─── */}
            <section aria-labelledby="partners-heading" className="py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-6 sm:px-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                            Global & Local Coalitions
                        </p>
                        <h2
                            id="partners-heading"
                            className="mt-3 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl"
                        >
                            Trusted by Leading Global Health & Development Partners
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                            HOVUCA collaborates with multilateral agencies, healthcare funds, and community coalitions to ensure evidence-based, sustainable development.
                        </p>
                    </div>

                    <div className="mt-10">
                        <DonorCarousel />
                    </div>
                </div>
            </section>

            {/* ─── Frequently Asked Questions ─── */}
            <section
                id="faq"
                aria-labelledby="faq-heading"
                className="border-t border-primary/10 bg-muted/15 py-16 sm:py-24"
            >
                <div className="mx-auto max-w-4xl px-6 sm:px-10">
                    <div className="text-center">
                        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-coral">
                            Donor Support & Guidance
                        </p>
                        <h2
                            id="faq-heading"
                            className="mt-3 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl"
                        >
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                            Have questions before giving? Here are answers to common donor inquiries.
                        </p>
                    </div>

                    <div className="mt-10">
                        <DonationFaq />
                    </div>
                </div>
            </section>

            {/* ─── Other Ways to Give & Corporate Giving ─── */}
            <section className="bg-primary py-16 text-white sm:py-20">
                <div className="mx-auto max-w-7xl px-6 sm:px-10">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="font-display text-3xl font-bold sm:text-4xl">
                            Other Ways to Partner With HOVUCA
                        </h2>
                        <p className="mt-4 text-base text-white/85">
                            Beyond individual financial giving, we invite foundations, businesses, and volunteers to collaborate with us.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                            <Handshake aria-hidden="true" className="size-8 text-brand-gold" />
                            <h3 className="mt-4 font-display text-lg font-bold">
                                Corporate & Grant Co-Funding
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-white/80">
                                Sponsor a full school cycle, fund a community health post, or provide equipment grants with detailed donor telemetry.
                            </p>
                            <Link
                                href="/contact"
                                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-brand-gold underline underline-offset-4"
                            >
                                Inquire about grants <ArrowRight aria-hidden="true" className="size-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                            <Heart aria-hidden="true" className="size-8 text-brand-coral" />
                            <h3 className="mt-4 font-display text-lg font-bold">
                                Sponsor a Child or Program
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-white/80">
                                Form a direct sponsorship link covering schooling, nutrition, healthcare, and mentoring for a vulnerable child in Cameroon.
                            </p>
                            <Link
                                href="/programs"
                                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-brand-gold underline underline-offset-4"
                            >
                                Explore child programs <ArrowRight aria-hidden="true" className="size-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                            <Users aria-hidden="true" className="size-8 text-brand-mint-light" />
                            <h3 className="mt-4 font-display text-lg font-bold">
                                Volunteer Your Expertise
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-white/80">
                                Join our field operations in Cameroon or contribute remotely in research, grant writing, digital technology, or education.
                            </p>
                            <Link
                                href="/volunteers"
                                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-brand-gold underline underline-offset-4"
                            >
                                Join as volunteer <ArrowRight aria-hidden="true" className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
