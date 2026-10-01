"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
    question: string;
    answer: string;
}

const FAQS: FaqItem[] = [
    {
        question: "How is my donation utilized across HOVUCA's programs?",
        answer:
            "Over 85% of every donation goes directly to on-the-ground programmatic action in Cameroon. This includes funding back-to-school kits and tuition support for vulnerable children, producing and distributing reusable menstrual hygiene kits for adolescent girls, offering vocational training apprenticeships for young women, and delivering community health outreach. 10% supports field logistics, monitoring, and child safeguarding, and 5% covers statutory compliance and annual financial audits.",
    },
    {
        question: "How do MTN Mobile Money and Orange Money donations work via CamPay?",
        answer:
            "Mobile money payments in Cameroon are processed via CamPay, an authorized and encrypted national payment gateway. When you click to donate, you are redirected to the CamPay secure portal where you enter your MTN or Orange phone number. Your phone will immediately receive a USSD push authorization prompt (*126# for MTN MoMo or *150# for Orange Money) asking you to approve the transaction with your private mobile PIN. No banking passwords or card numbers are required.",
    },
    {
        question: "Can I donate from outside Cameroon in foreign currencies?",
        answer:
            "Yes! A substantial portion of our work is made possible by international partners, friends, and the Cameroonian diaspora. You can donate seamlessly through PayPal using any international credit or debit card (USD, EUR, GBP, CAD, etc.), or instruct your bank to execute an international wire transfer using our SWIFT/BIC code (UNAFCMCX) and IBAN (CM21 10033 05207 07031000336 60).",
    },
    {
        question: "Will I receive an official receipt and tax acknowledgment?",
        answer:
            "Yes. For payments made through PayPal or CamPay, you receive an immediate digital transaction confirmation from the payment provider. For bank transfers, simply email your transfer receipt or generated reference to contact@hovuca.org. Our finance office will promptly issue an official, signed HOVUCA NGO acknowledgment letter and donation receipt for your tax and accounting records.",
    },
    {
        question: "Is HOVUCA an accredited non-profit organization?",
        answer:
            "Yes. Hope for Vulnerable Children Association (HOVUCA) is a legally recognized, accredited non-governmental organization registered under the laws of the Republic of Cameroon. We operate with strict child safeguarding policies, transparent governance, and published annual reports.",
    },
    {
        question: "Can my company or foundation sponsor an entire project or event?",
        answer:
            "We warmly welcome corporate giving, foundation grants, and project co-funding partnerships. You can sponsor an entire school class, a village water & sanitation initiative, or a community health campaign. Please reach out directly to our leadership team via our Contact page or at contact@hovuca.org to discuss custom partnerships and reporting arrangements.",
    },
];

export default function DonationFaq() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex((current) => (current === index ? null : index));
    };

    return (
        <div className="space-y-3">
            {FAQS.map((faq, index) => {
                const isOpen = openIndex === index;
                const panelId = `faq-panel-${index}`;
                const buttonId = `faq-button-${index}`;

                return (
                    <div
                        key={faq.question}
                        className="overflow-hidden rounded-xl border border-primary/15 bg-background transition-colors hover:border-primary/30"
                    >
                        <h3>
                            <button
                                id={buttonId}
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(index)}
                                className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg"
                            >
                                <span className="flex items-center gap-3">
                                    <HelpCircle aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                                    <span>{faq.question}</span>
                                </span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                        isOpen ? "rotate-180 text-primary" : ""
                                    }`}
                                />
                            </button>
                        </h3>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            hidden={!isOpen}
                            className={`px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:pl-12 ${
                                isOpen ? "block" : "hidden"
                            }`}
                        >
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
