import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DonationMethods from "@/components/donations/DonationMethods";
import { constructMetadata, getBreadcrumbSchema, SITE_CONFIG, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Donate & Support Our Work",
    description:
        "Support HOVUCA's community-led work in Cameroon. Give by direct bank transfer, PayPal, MTN MoMo, or Orange Money through CamPay.",
    path: "/donate",
    keywords: [
        "donate to HOVUCA",
        "Cameroon charity donation",
        "support vulnerable children Africa",
        "give to Cameroon NGO",
        "PayPal donation Cameroon",
        "MTN MoMo charity Cameroon",
        "Orange Money donation",
    ],
});

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
        },
        name: "Donate to HOVUCA",
        description: "Support vulnerable children, girls, young people, and communities in Cameroon.",
    };

    return (
        <div className="bg-background text-[var(--brand-forest)]">
            <JsonLd data={breadcrumbs} />
            <JsonLd data={donateSchema} />
            <section aria-labelledby="donate-heading" className="grid lg:grid-cols-[1fr_1fr]">
                <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-[max(2.5rem,calc((100vw-1280px)/2))] lg:pr-12 lg:py-20">
                    <h1 id="donate-heading" className="max-w-xl font-display text-5xl font-bold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                        Give today.<br />Build possibilities.
                    </h1>
                    <p className="mt-7 max-w-lg text-lg leading-8 text-[var(--brand-body-muted)]">
                        Support HOVUCA’s work alongside children, girls, young people and communities in Cameroon.
                    </p>
                    <a
                        href="#payment-methods"
                        className="mt-9 inline-flex min-h-12 w-fit items-center gap-6 bg-[var(--brand-coral)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-coral-dark)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-forest)]"
                    >
                        Choose how to give <ArrowRight aria-hidden="true" className="size-5" />
                    </a>
                </div>
                <div className="relative min-h-80 sm:min-h-[430px] lg:min-h-[560px]">
                    <Image
                        src="/assets/plates/program-photo.webp"
                        alt="Participants in a community activity"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                    />
                </div>
            </section>

            <section id="payment-methods" aria-labelledby="methods-heading" className="mx-auto grid max-w-7xl scroll-mt-28 gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-24">
                <div>
                    <h2 id="methods-heading" className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
                        Your support.<br />Your way.
                    </h2>
                    <p className="mt-6 max-w-md leading-7 text-[var(--brand-body-muted)]">
                        Make a direct bank transfer, donate through PayPal, or use MTN MoMo or Orange Money with CamPay.
                    </p>
                    <p className="mt-5 max-w-md leading-7 text-[var(--brand-body-muted)]">
                        For online payments, the amount, currency and payment confirmation are handled by your selected provider.
                    </p>
                    <Link
                        href="/contact"
                        className="mt-7 inline-flex min-h-11 items-center gap-3 font-semibold underline underline-offset-4 hover:text-[var(--brand-coral-dark)]"
                    >
                        Questions about giving? <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
                <DonationMethods />
            </section>

            <section className="bg-[var(--brand-forest)] text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
                    <h2 className="max-w-lg font-display text-4xl font-bold leading-tight sm:text-5xl">
                        See the work<br />you’re supporting.
                    </h2>
                    <div>
                        <p className="max-w-xl text-lg leading-8 text-white/85">
                            Explore our programs and community stories to learn more about HOVUCA’s approach and the people at the centre of our work.
                        </p>
                        <Link
                            href="/programs"
                            className="mt-6 inline-flex min-h-11 items-center gap-3 font-semibold underline decoration-[var(--brand-gold)] underline-offset-8"
                        >
                            Explore our programs <ArrowRight aria-hidden="true" className="size-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:py-20">
                <h2 className="font-display text-3xl font-bold">After you donate</h2>
                <div className="mt-6 grid gap-8 leading-7 text-[var(--brand-body-muted)] sm:grid-cols-2">
                    <p>For PayPal and CamPay, keep the payment confirmation provided at checkout. Opening a checkout page does not confirm that a payment has been made.</p>
                    <p>For a bank transfer, keep your transfer reference. Contact our team if you would like us to confirm receipt or help with your donation.</p>
                </div>
            </section>
        </div>
    );
}
