import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { constructMetadata, getBreadcrumbSchema, SITE_CONFIG, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Contact Us & Partner With Us",
    description:
        "Contact HOVUCA in Yaoundé, Cameroon. Connect with our team about institutional partnerships, volunteering, donations, and our grassroots work for children.",
    path: "/contact",
    keywords: [
        "contact HOVUCA",
        "HOVUCA Cameroon office",
        "partner with HOVUCA",
        "NGO Yaoundé contact",
        "volunteer contact Cameroon",
    ],
});

export default function ContactPage() {
    const breadcrumbs = getBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
    ]);

    const contactPageSchema = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact HOVUCA",
        url: `${SITE_URL}/contact`,
        mainEntity: {
            "@type": "NGO",
            name: SITE_CONFIG.name,
            telephone: SITE_CONFIG.telephone,
            email: SITE_CONFIG.email,
            address: {
                "@type": "PostalAddress",
                streetAddress: SITE_CONFIG.address.streetAddress,
                addressLocality: SITE_CONFIG.address.addressLocality,
                addressCountry: SITE_CONFIG.address.addressCountry,
            },
        },
    };

    return (
        <div className="bg-background text-[var(--brand-forest)]">
            <JsonLd data={breadcrumbs} />
            <JsonLd data={contactPageSchema} />
            <section className="border-b border-[var(--brand-forest)]/20">
                <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
                    <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.06] tracking-tight sm:text-7xl lg:text-8xl">
                        Good work starts with a conversation.
                    </h1>
                    <div className="mt-8 grid gap-8 md:grid-cols-2">
                        <p className="max-w-xl text-lg leading-8 text-[var(--brand-body-muted)]">
                            Have a question, a partnership idea, or a way to contribute? We would like to hear from you.
                        </p>
                        <a
                            href="#contact-form"
                            className="flex min-h-12 w-fit items-center gap-5 border-b border-[var(--brand-forest)] font-semibold"
                        >
                            Get in touch <ArrowUpRight aria-hidden="true" className="size-5" />
                        </a>
                    </div>
                </div>
            </section>
            <section id="contact-form" className="mx-auto grid max-w-7xl scroll-mt-28 gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.3fr_1fr] lg:gap-24">
                <ContactForm />
                <aside className="self-start bg-[var(--brand-forest)] p-8 text-[var(--brand-paper)] sm:p-10">
                    <h2 className="font-display text-3xl font-bold">Reach us directly</h2>
                    <dl className="mt-8 space-y-7">
                        <div>
                            <dt className="text-sm text-[var(--brand-paper)]/70">Email</dt>
                            <dd className="mt-2 break-all text-xl">
                                <a className="underline underline-offset-4" href="mailto:contact@hovuca.org">contact@hovuca.org</a>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-[var(--brand-paper)]/70">Phone</dt>
                            <dd className="mt-2 text-xl">
                                <a className="underline underline-offset-4" href="tel:+237696230391">+237 696 230 391</a>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-[var(--brand-paper)]/70">Head office</dt>
                            <dd className="mt-2 text-xl leading-8">Grande Chefferie Simbock<br />Yaoundé, Cameroon</dd>
                        </div>
                    </dl>
                    <p className="mt-6 text-sm leading-6 text-[var(--brand-paper)]/75">Please contact us before visiting so we can arrange your visit.</p>
                    <a
                        href="https://www.google.com/maps/search/?api=1&query=Grande+Chefferie+Simbock+Yaound%C3%A9+Cameroon"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex min-h-12 items-center gap-4 border-b border-[var(--brand-paper)]/50 font-semibold"
                    >
                        Find directions <ArrowUpRight aria-hidden="true" className="size-5" />
                    </a>
                </aside>
            </section>
            <section className="mx-auto max-w-7xl px-6 pb-20">
                <div className="grid gap-8 border-t border-[var(--brand-forest)]/20 pt-10 md:grid-cols-2">
                    <div>
                        <h2 className="font-display text-2xl font-bold">Ready to volunteer?</h2>
                        <p className="mt-3 leading-7 text-[var(--brand-body-muted)]">Tell us about your skills and availability through our volunteer application.</p>
                        <Link className="mt-4 inline-flex min-h-12 items-center font-semibold underline underline-offset-4" href="/volunteers">Apply to volunteer</Link>
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-bold">Looking to make a donation?</h2>
                        <p className="mt-3 leading-7 text-[var(--brand-body-muted)]">Explore bank transfer, PayPal, MTN Mobile Money, and Orange Money options.</p>
                        <Link className="mt-4 inline-flex min-h-12 items-center font-semibold underline underline-offset-4" href="/donate">View donation methods</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
