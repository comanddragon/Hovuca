"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowUpRight,
    Building2,
    Check,
    Copy,
    Heart,
    Loader2,
    Lock,
    Mail,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Wallet,
    CreditCard,
} from "lucide-react";
import { donationsService } from "@/services";
import { useCampaigns } from "@/hooks";
import { toast } from "sonner";

export type CurrencyCode = "XAF" | "USD" | "EUR" | "GBP";

interface CurrencyPreset {
    amount: number;
    label: string;
    impact: string;
    popular?: boolean;
}

interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    name: string;
    presets: CurrencyPreset[];
    customMin: number;
    customPlaceholder: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    XAF: {
        code: "XAF",
        symbol: "FCFA",
        name: "FCFA (XAF) · Cameroon & CEMAC",
        presets: [
            {
                amount: 10000,
                label: "10,000 FCFA",
                impact: "Back-to-School Kit: Backpack, notebooks, textbooks, and writing materials for 1 vulnerable child.",
            },
            {
                amount: 25000,
                label: "25,000 FCFA",
                impact: "Menstrual Dignity: 1 year of reusable sanitary pads, hygiene soap, and SRHR guidance for 3 adolescent girls.",
                popular: true,
            },
            {
                amount: 60000,
                label: "60,000 FCFA",
                impact: "Vocational Skills Training: 3 months of tailoring, craft, or computer literacy apprenticeship for a young woman.",
            },
            {
                amount: 150000,
                label: "150,000 FCFA",
                impact: "Community Health Outreach: First-aid kits, health screenings, and nutrition supplies for 100+ rural youth.",
            },
        ],
        customMin: 1000,
        customPlaceholder: "e.g. 50000",
    },
    USD: {
        code: "USD",
        symbol: "$",
        name: "USD ($) · International & US",
        presets: [
            {
                amount: 25,
                label: "$25",
                impact: "Back-to-School Kit: Backpack, notebooks, textbooks, and writing materials for 1 vulnerable child.",
            },
            {
                amount: 50,
                label: "$50",
                impact: "Menstrual Dignity: 1 year of reusable sanitary pads, hygiene soap, and SRHR guidance for 3 adolescent girls.",
                popular: true,
            },
            {
                amount: 100,
                label: "$100",
                impact: "Vocational Skills Training: 3 months of tailoring, craft, or computer literacy apprenticeship for a young woman.",
            },
            {
                amount: 250,
                label: "$250",
                impact: "Community Health Outreach: First-aid kits, health screenings, and nutrition supplies for 100+ rural youth.",
            },
        ],
        customMin: 5,
        customPlaceholder: "e.g. 75",
    },
    EUR: {
        code: "EUR",
        symbol: "€",
        name: "EUR (€) · Europe",
        presets: [
            {
                amount: 20,
                label: "20 €",
                impact: "Back-to-School Kit: Backpack, notebooks, textbooks, and writing materials for 1 vulnerable child.",
            },
            {
                amount: 45,
                label: "45 €",
                impact: "Menstrual Dignity: 1 year of reusable sanitary pads, hygiene soap, and SRHR guidance for 3 adolescent girls.",
                popular: true,
            },
            {
                amount: 90,
                label: "90 €",
                impact: "Vocational Skills Training: 3 months of tailoring, craft, or computer literacy apprenticeship for a young woman.",
            },
            {
                amount: 220,
                label: "220 €",
                impact: "Community Health Outreach: First-aid kits, health screenings, and nutrition supplies for 100+ rural youth.",
            },
        ],
        customMin: 5,
        customPlaceholder: "e.g. 60",
    },
    GBP: {
        code: "GBP",
        symbol: "£",
        name: "GBP (£) · United Kingdom",
        presets: [
            {
                amount: 20,
                label: "£20",
                impact: "Back-to-School Kit: Backpack, notebooks, textbooks, and writing materials for 1 vulnerable child.",
            },
            {
                amount: 40,
                label: "£40",
                impact: "Menstrual Dignity: 1 year of reusable sanitary pads, hygiene soap, and SRHR guidance for 3 adolescent girls.",
                popular: true,
            },
            {
                amount: 85,
                label: "£85",
                impact: "Vocational Skills Training: 3 months of tailoring, craft, or computer literacy apprenticeship for a young woman.",
            },
            {
                amount: 200,
                label: "£200",
                impact: "Community Health Outreach: First-aid kits, health screenings, and nutrition supplies for 100+ rural youth.",
            },
        ],
        customMin: 5,
        customPlaceholder: "e.g. 50",
    },
};

const PAYMENT_METHODS = [
    {
        id: "momo",
        label: "MTN MoMo & Orange",
        subtitle: "Cameroon Mobile Money (CamPay)",
        icon: Smartphone,
        tag: "Instant in Cameroon",
    },
    {
        id: "paypal",
        label: "PayPal & Cards",
        subtitle: "Visa, Mastercard, Amex, PayPal",
        icon: Wallet,
        tag: "Global & Cards",
    },
    {
        id: "bank",
        label: "Direct Bank Transfer",
        subtitle: "UBA Cameroon / Wire Transfer",
        icon: Building2,
        tag: "Local & International Wire",
    },
] as const;

type MethodId = typeof PAYMENT_METHODS[number]["id"];

const PROGRAM_DESIGNATIONS = [
    { id: "general", label: "Where Needed Most (General Fund)" },
    { id: "girls", label: "Girls' Empowerment & Menstrual Health (Strong Girls Corner)" },
    { id: "protection", label: "Child Protection & Vulnerable Children" },
    { id: "skills", label: "Vocational Apprenticeship & Youth Livelihoods" },
    { id: "health", label: "Community Health, Nutrition & SRHR Advocacy" },
];

function sanitizeHttpsUrl(value: string | undefined): string | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
    } catch {
        return null;
    }
}

export default function DonationMethods() {
    // ── Giving Parameters State ──
    const [frequency, setFrequency] = useState<"once" | "monthly">("once");
    const [currency, setCurrency] = useState<CurrencyCode>("XAF");
    const [selectedAmount, setSelectedAmount] = useState<number | null>(25000);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [designation, setDesignation] = useState<string>("general");
    const [method, setMethod] = useState<MethodId>("momo");

    // ── Dedication State ──
    const [hasDedication, setHasDedication] = useState(false);
    const [dedicationName, setDedicationName] = useState("");
    const [dedicationMessage, setDedicationMessage] = useState("");

    // ── Bank Transfer Helper State ──
    const [donorRefName, setDonorRefName] = useState("");
    const [defaultRefSeed] = useState(() => Math.floor(1000 + Math.random() * 9000));
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // ── Query Payment Settings from Backend ──
    const { data: settings, isLoading, isError, refetch } = useQuery({
        queryKey: ["donation-payment-settings"],
        queryFn: donationsService.getPaymentSettings,
        staleTime: 1000 * 60 * 15,
    });

    // ── Optional: Query active campaigns to include in designations ──
    const { data: campaignsData } = useCampaigns({ status: "active" });
    const campaigns = campaignsData?.results ?? [];

    const currencyConfig = CURRENCIES[currency];

    // Current effective amount
    const activeAmount = useMemo(() => {
        if (customAmount) {
            const parsed = parseFloat(customAmount);
            return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
        }
        return selectedAmount ?? 0;
    }, [customAmount, selectedAmount]);

    // Active impact text
    const activeImpact = useMemo(() => {
        if (customAmount) {
            const parsed = parseFloat(customAmount);
            if (parsed > 0) {
                return `Every ${currencyConfig.symbol} you give directly provides education, healthcare, and dignity for children and girls in Cameroon.`;
            }
            return "";
        }
        const matched = currencyConfig.presets.find((p) => p.amount === selectedAmount);
        return matched?.impact || "";
    }, [customAmount, selectedAmount, currencyConfig]);

    const formattedAmount = useMemo(() => {
        if (!activeAmount) return "";
        if (currency === "XAF") {
            return `${activeAmount.toLocaleString()} FCFA`;
        }
        return `${currencyConfig.symbol}${activeAmount.toLocaleString()}`;
    }, [activeAmount, currency, currencyConfig.symbol]);

    // Format currency switch
    const handleCurrencyChange = (newCurrency: CurrencyCode) => {
        setCurrency(newCurrency);
        const newConfig = CURRENCIES[newCurrency];
        const defaultPreset = newConfig.presets.find((p) => p.popular) || newConfig.presets[1] || newConfig.presets[0];
        setSelectedAmount(defaultPreset.amount);
        setCustomAmount("");
    };

    // Bank Details (using server settings with official verified HOVUCA fallback defaults)
    const bankDetails = useMemo(() => {
        const bankName = settings?.bank_name || "United Bank for Africa (UBA) Cameroon";
        const accountName = settings?.account_name || "Hope for Vulnerable Children Association (HOVUCA)";
        const accountNumber = settings?.account_number || "07031000336";
        const iban = settings?.iban || "CM21 10033 05207 07031000336 60";
        const swift = settings?.swift_code || "UNAFCMCX";
        const currencyCode = settings?.bank_currency || "XAF";
        const branch = "Hippodrome, Avenue des Banques, P.O. Box 1029, Yaoundé, Cameroon";
        const instructions = settings?.bank_instructions || "Please indicate your donor reference in the transfer memo. Email your confirmation receipt to contact@hovuca.org so we can issue your official tax/donation certificate.";

        return [
            { label: "Bank Name", value: bankName, key: "bank" },
            { label: "Account Name", value: accountName, key: "account_name" },
            { label: "Account Number", value: accountNumber, key: "account_number", copyable: true },
            { label: "IBAN Code", value: iban, key: "iban", copyable: true },
            { label: "SWIFT / BIC Code", value: swift, key: "swift", copyable: true },
            { label: "Bank Branch / Address", value: branch, key: "branch" },
            { label: "Currency", value: currencyCode, key: "currency" },
            { label: "Special Instructions", value: instructions, key: "instructions" },
        ];
    }, [settings]);

    const generatedReference = useMemo(() => {
        const clean = donorRefName.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        return clean ? `HOV-${clean}` : `HOV-GIFT-${defaultRefSeed}`;
    }, [donorRefName, defaultRefSeed]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(label);
            toast.success(`${label} copied to clipboard`);
            setTimeout(() => setCopiedField(null), 2500);
        } catch {
            toast.error("Could not copy automatically. Please highlight and copy manually.");
        }
    };

    const copyAllBankDetails = async () => {
        const summary = [
            "HOVUCA — Official Bank Transfer Details",
            "---------------------------------------",
            ...bankDetails.map((b) => `${b.label}: ${b.value}`),
            `Transfer Reference Memo: ${generatedReference}`,
            "Official Email for Receipt Confirmation: contact@hovuca.org",
        ].join("\n");

        await copyToClipboard(summary, "All bank details");
    };

    // Checkout URLs
    const campayUrl = sanitizeHttpsUrl(settings?.campay_url);
    const paypalUrl = sanitizeHttpsUrl(settings?.paypal_url) || "https://www.paypal.com/donate/?hosted_button_id=CMJ5JBW7V6U5Y";

    return (
        <div className="rounded-2xl border border-primary/15 bg-card p-6 shadow-xl sm:p-8 lg:p-10">
            {/* Header: Giving Frequency + Currency Selector */}
            <div className="flex flex-col gap-5 border-b border-primary/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Frequency Pill Switcher */}
                <div
                    role="radiogroup"
                    aria-label="Donation frequency"
                    className="inline-flex rounded-xl bg-muted/60 p-1.5 ring-1 ring-primary/15"
                >
                    <button
                        type="button"
                        role="radio"
                        aria-checked={frequency === "once"}
                        onClick={() => setFrequency("once")}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                            frequency === "once"
                                ? "bg-white text-primary shadow-sm dark:bg-primary dark:text-white"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Give once
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={frequency === "monthly"}
                        onClick={() => setFrequency("monthly")}
                        className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                            frequency === "monthly"
                                ? "bg-white text-primary shadow-sm dark:bg-primary dark:text-white"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Heart aria-hidden="true" className="size-3.5 fill-brand-coral text-brand-coral" />
                        Monthly giving
                    </button>
                </div>

                {/* Currency Switcher */}
                <div className="flex items-center gap-2">
                    <label htmlFor="currency-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Currency:
                    </label>
                    <select
                        id="currency-select"
                        value={currency}
                        onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                        className="rounded-lg border border-primary/20 bg-background px-3 py-1.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        {Object.values(CURRENCIES).map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {frequency === "monthly" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-mint-surface/80 p-3 text-xs font-medium text-primary">
                    <Sparkles aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                    <span>
                        Monthly donations provide stable, predictable protection and educational support for vulnerable children throughout the school year.
                    </span>
                </div>
            )}

            {/* Step 1: Preset Amount Cards */}
            <div className="mt-8">
                <div className="flex items-center justify-between">
                    <label className="font-display text-lg font-bold text-foreground">
                        Select an amount ({currencyConfig.symbol})
                    </label>
                    {frequency === "monthly" && (
                        <span className="text-xs font-semibold text-brand-coral">Billed monthly</span>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {currencyConfig.presets.map((preset) => {
                        const isSelected = !customAmount && selectedAmount === preset.amount;
                        return (
                            <button
                                key={preset.amount}
                                type="button"
                                onClick={() => {
                                    setSelectedAmount(preset.amount);
                                    setCustomAmount("");
                                }}
                                className={`relative flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                                    isSelected
                                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                                        : "border-primary/20 bg-background hover:border-primary/40 hover:bg-muted/30"
                                }`}
                            >
                                {preset.popular && (
                                    <span className="absolute -top-2.5 rounded-full bg-brand-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                        Most popular
                                    </span>
                                )}
                                <span className="font-display text-lg font-bold text-foreground">{preset.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Amount Field */}
                <div className="mt-4">
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                            {currencyConfig.symbol}
                        </span>
                        <input
                            type="number"
                            min={currencyConfig.customMin}
                            step="any"
                            placeholder={`Or enter custom amount (${currencyConfig.customPlaceholder})`}
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedAmount(null);
                            }}
                            className={`w-full rounded-xl border py-3 pl-16 pr-4 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-primary ${
                                customAmount ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-primary/20 bg-background"
                            }`}
                        />
                    </div>
                </div>

                {/* Tangible Impact Callout */}
                {activeImpact && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-coral/20 bg-brand-coral/5 p-4 text-sm text-foreground">
                        <Heart aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-brand-coral text-brand-coral" />
                        <div>
                            <span className="font-bold text-brand-coral-deep">Your impact: </span>
                            <span className="text-foreground/90">{activeImpact}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Program Designation */}
            <div className="mt-8 border-t border-primary/10 pt-6">
                <label htmlFor="designation-select" className="block font-display text-base font-bold text-foreground">
                    Direct your gift (Optional)
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Choose a specific program or allow HOVUCA to allocate where resources are needed most urgently.
                </p>
                <select
                    id="designation-select"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                >
                    {PROGRAM_DESIGNATIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.label}
                        </option>
                    ))}
                    {campaigns.length > 0 && (
                        <optgroup label="Active Fundraising Campaigns">
                            {campaigns.map((c) => (
                                <option key={c.id} value={`campaign-${c.id}`}>
                                    Campaign: {c.title}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {/* Step 3: Choose Payment Method */}
            <div className="mt-8 border-t border-primary/10 pt-6">
                <fieldset>
                    <legend className="font-display text-lg font-bold text-foreground">
                        Choose your payment method
                    </legend>
                    <p className="mt-1 text-xs text-muted-foreground">
                        All payments are securely handled directly by verified financial providers.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {PAYMENT_METHODS.map(({ id, label, subtitle, icon: Icon, tag }) => {
                            const isSelected = method === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setMethod(id)}
                                    className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                                        isSelected
                                            ? "border-primary bg-brand-mint-surface shadow-sm ring-2 ring-primary"
                                            : "border-primary/20 bg-background hover:border-primary/40 hover:bg-muted/20"
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Icon aria-hidden="true" className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                            {isSelected && (
                                                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-white">
                                                    <Check aria-hidden="true" className="size-2.5" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-3 font-display text-sm font-bold text-foreground">{label}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                                    </div>
                                    <span className="mt-3 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {tag}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                {/* Method Details Pane */}
                <div className="mt-6 rounded-xl border border-primary/15 bg-muted/20 p-5 sm:p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
                            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
                            Loading verified payment details…
                        </div>
                    ) : isError ? (
                        <div className="rounded-xl border border-brand-error/20 bg-brand-error-surface/40 p-4">
                            <p className="text-sm font-medium text-foreground">
                                Unable to load dynamic payment configuration. You can still donate directly using our verified bank details below.
                            </p>
                            <button
                                type="button"
                                onClick={() => void refetch()}
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-forest-deep"
                            >
                                <RefreshCw aria-hidden="true" className="size-3" /> Retry loading
                            </button>
                        </div>
                    ) : method === "momo" ? (
                        /* Mobile Money (CamPay) */
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display text-lg font-bold text-foreground">
                                    Donate via MTN Mobile Money or Orange Money
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-800 dark:text-yellow-300">
                                        MTN MoMo
                                    </span>
                                    <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:text-orange-300">
                                        Orange Money
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Mobile payments are processed instantly and securely via <strong>CamPay</strong>, Cameroon&apos;s licensed digital payment infrastructure.
                            </p>

                            {/* 3-Step Walkthrough */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-primary/10 bg-background p-3 text-xs">
                                    <span className="font-bold text-brand-coral">1. Click checkout</span>
                                    <p className="mt-1 text-muted-foreground">Click the button below to proceed to the secure CamPay gateway.</p>
                                </div>
                                <div className="rounded-lg border border-primary/10 bg-background p-3 text-xs">
                                    <span className="font-bold text-brand-coral">2. Enter mobile number</span>
                                    <p className="mt-1 text-muted-foreground">Select MTN or Orange and type your Cameroonian mobile phone number.</p>
                                </div>
                                <div className="rounded-lg border border-primary/10 bg-background p-3 text-xs">
                                    <span className="font-bold text-brand-coral">3. Authorize with PIN</span>
                                    <p className="mt-1 text-muted-foreground">Approve the instant USSD prompt (*126# / *150#) on your phone with your PIN.</p>
                                </div>
                            </div>

                            {campayUrl ? (
                                <div>
                                    <a
                                        href={campayUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-brand-coral px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-brand-coral-dark focus-visible:outline-2 focus-visible:outline-primary sm:w-auto"
                                    >
                                        <span>Proceed to CamPay {formattedAmount ? `(${formattedAmount})` : ""}</span>
                                        <ArrowUpRight aria-hidden="true" className="size-4" />
                                    </a>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        You will be redirected to CamPay&apos;s encrypted payment gateway.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-primary/20 bg-background p-4 text-sm">
                                    <p className="font-medium text-foreground">
                                        Online Mobile Money portal link is being updated.
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        You can donate immediately via Direct Bank Transfer or reach out to our finance team for assistance.
                                    </p>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setMethod("bank")}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                        >
                                            View Bank Transfer details
                                        </button>
                                        <Link
                                            href="/contact"
                                            className="inline-flex items-center gap-2 rounded-lg border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted"
                                        >
                                            Contact Support
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : method === "paypal" ? (
                        /* PayPal & Cards */
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display text-lg font-bold text-foreground">
                                    Donate via PayPal, Credit Card, or Debit Card
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CreditCard aria-hidden="true" className="size-4 text-primary" />
                                    <span className="font-semibold">Visa · Mastercard · Amex · PayPal</span>
                                </div>
                            </div>

                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Fast, encrypted international giving. You can use your PayPal balance or <strong>any major international credit/debit card</strong> without needing a PayPal account.
                            </p>

                            <div className="rounded-lg border border-primary/10 bg-background p-4 text-xs leading-relaxed text-muted-foreground">
                                <p className="font-semibold text-foreground">International Currency Support:</p>
                                <p className="mt-1">
                                    PayPal accepts contributions in USD, EUR, GBP, CAD, and other major currencies with automatic conversion and instantaneous digital donation receipts.
                                </p>
                            </div>

                            {paypalUrl ? (
                                <div>
                                    <a
                                        href={paypalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-brand-forest-deep focus-visible:outline-2 focus-visible:outline-primary sm:w-auto"
                                    >
                                        <span>Continue to PayPal {formattedAmount ? `(${formattedAmount})` : ""}</span>
                                        <ArrowUpRight aria-hidden="true" className="size-4" />
                                    </a>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Opens PayPal&apos;s 256-bit encrypted checkout in a new window.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-primary/20 bg-background p-4 text-sm">
                                    <p className="font-medium text-foreground">PayPal gateway is currently being updated.</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Please consider our direct bank wire transfer or contact our team directly.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setMethod("bank")}
                                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        View Bank Wire Details
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Direct Bank Transfer (UBA Cameroon) */
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="font-display text-lg font-bold text-foreground">
                                        Direct Bank Wire Transfer (UBA Cameroon)
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        For local Cameroonian bank transfers or international SWIFT wire transfers.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void copyAllBankDetails()}
                                    className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-background px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
                                >
                                    <Copy aria-hidden="true" className="size-3.5" />
                                    Copy all details
                                </button>
                            </div>

                            {/* Bank Details Card */}
                            <div className="overflow-hidden rounded-xl border border-primary/20 bg-background shadow-sm">
                                <div className="border-b border-primary/10 bg-primary/5 px-4 py-3 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <span className="font-display text-sm font-bold text-primary">
                                            Official Receiving Account
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                                            <ShieldCheck aria-hidden="true" className="size-4" />
                                            Verified NGO Account
                                        </span>
                                    </div>
                                </div>

                                <dl className="divide-y divide-primary/10">
                                    {bankDetails.map((item) => (
                                        <div
                                            key={item.key}
                                            className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[160px_1fr_auto] sm:items-center sm:gap-4 sm:px-6"
                                        >
                                            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {item.label}
                                            </dt>
                                            <dd className="break-all font-mono text-sm font-semibold text-foreground">
                                                {item.value}
                                            </dd>
                                            <dd className="mt-1 sm:mt-0">
                                                {item.copyable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void copyToClipboard(item.value, item.label)}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-white"
                                                        aria-label={`Copy ${item.label}`}
                                                    >
                                                        {copiedField === item.label ? (
                                                            <>
                                                                <Check aria-hidden="true" className="size-3 text-green-600" />
                                                                <span className="text-green-700 dark:text-green-400 font-semibold">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy aria-hidden="true" className="size-3" />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Transfer Reference Generator */}
                            <div className="rounded-xl border border-primary/15 bg-background p-4 sm:p-5">
                                <h4 className="font-display text-sm font-bold text-foreground">
                                    Generate Transfer Reference / Memo
                                </h4>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Adding your reference in the bank transfer description helps our finance team match your donation immediately.
                                </p>
                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <input
                                        type="text"
                                        placeholder="Enter your name or organization"
                                        value={donorRefName}
                                        onChange={(e) => setDonorRefName(e.target.value)}
                                        className="flex-1 rounded-lg border border-primary/20 bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                                    />
                                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-mono text-xs font-bold text-primary">
                                        <span>Reference: {generatedReference}</span>
                                        <button
                                            type="button"
                                            onClick={() => void copyToClipboard(generatedReference, "Transfer reference")}
                                            className="text-primary hover:opacity-75"
                                            aria-label="Copy reference"
                                        >
                                            <Copy aria-hidden="true" className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Notify Finance Helper */}
                            <div className="rounded-xl bg-brand-mint-surface/80 p-4 text-xs leading-relaxed text-primary">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-bold text-primary">Have you completed your transfer?</p>
                                        <p className="text-muted-foreground">
                                            Notify our finance team so we can issue your official NGO tax acknowledgment and signed donation receipt.
                                        </p>
                                    </div>
                                    <a
                                        href={`mailto:contact@hovuca.org?subject=${encodeURIComponent(
                                            `Bank Transfer Donation Notification - ${generatedReference}`
                                        )}&body=${encodeURIComponent(
                                            `Dear HOVUCA Finance Team,\n\nI have initiated a bank wire transfer donation with the following details:\n\n- Donor Name: ${
                                                donorRefName || "[Your Name]"
                                            }\n- Reference Memo: ${generatedReference}\n- Amount: ${
                                                formattedAmount || "[Amount]"
                                            }\n- Date of Transfer: ${new Date().toLocaleDateString()}\n- Designated Program: ${designation}\n\nPlease confirm receipt and issue my official acknowledgment receipt.\n\nThank you,\n${
                                                donorRefName || "[Your Name]"
                                            }`
                                        )}`}
                                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-forest-deep"
                                    >
                                        <Mail aria-hidden="true" className="size-3.5" />
                                        Notify Finance via Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Optional Dedication / Gift in Honor Of */}
            <div className="mt-8 border-t border-primary/10 pt-6">
                <label className="flex cursor-pointer items-center gap-3">
                    <input
                        type="checkbox"
                        checked={hasDedication}
                        onChange={(e) => setHasDedication(e.target.checked)}
                        className="size-4 rounded accent-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">
                        Dedicate this donation in honor or memory of someone special
                    </span>
                </label>

                {hasDedication && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-primary/15 bg-muted/15 p-4 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Honoree Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Dr. Jane Smith or In Memory of Grandpa John"
                                value={dedicationName}
                                onChange={(e) => setDedicationName(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-primary/20 bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Note / Message (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Keep inspiring hope for every girl!"
                                value={dedicationMessage}
                                onChange={(e) => setDedicationMessage(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-primary/20 bg-background px-3 py-2 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Trust & Transparency Badges */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-primary/10 pt-6 sm:grid-cols-4">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Lock aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                    <span>256-bit SSL Bank-Grade Security</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                    <span>Registered Cameroon NGO</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Sparkles aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                    <span>100% Impact Stewardship</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Mail aria-hidden="true" className="size-4 shrink-0 text-brand-coral" />
                    <span>Official Tax Receipts Issued</span>
                </div>
            </div>
        </div>
    );
}
