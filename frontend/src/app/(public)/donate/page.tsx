"use client";

import { useState, useEffect } from "react";
import { useCampaigns, useDonate } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Heart, Shield, Users, Globe, CheckCircle2, Lock, Star, ArrowRight, Sparkles
} from "lucide-react";
import type { DonationCampaign, DonationGateway } from "@/types";

// ─── Preset amounts ───────────────────────────────────────────────────────────
const PRESETS = [10, 25, 50, 100, 250, 500];

const GATEWAYS: { id: DonationGateway; label: string; icon: string }[] = [
    { id: "stripe", label: "Card", icon: "💳" },
    { id: "paypal", label: "PayPal", icon: "🅿️" },
    { id: "manual", label: "Manual", icon: "🏦" },
];

const IMPACTS = [
    { amount: 10, label: "School supplies for 1 child for a month" },
    { amount: 25, label: "Health checkup for 3 vulnerable children" },
    { amount: 50, label: "Safe shelter for a family for a week" },
    { amount: 100, label: "Educational materials for an entire class" },
    { amount: 250, label: "Fund a community workshop on child rights" },
    { amount: 500, label: "Support a program for 10 girls for a month" },
];

const TRUST_SIGNALS = [
    { icon: Shield, label: "Secure payments", sub: "256-bit SSL encrypted" },
    { icon: CheckCircle2, label: "100% transparent", sub: "Full financial reports" },
    { icon: Users, label: "15+ years of impact", sub: "Verified NGO since 2009" },
    { icon: Globe, label: "Community-led", sub: "Locally rooted programs" },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ raised, goal }: { raised: string; goal: string }) {
    const pct = Math.min((parseFloat(raised) / parseFloat(goal)) * 100, 100);
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-medium text-foreground">${parseFloat(raised).toLocaleString()} raised</span>
                <span>of ${parseFloat(goal).toLocaleString()} goal</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    viewport={{ once: true }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% funded</p>
        </div>
    );
}

// ─── Campaign card ────────────────────────────────────────────────────────────
function CampaignCard({
                          campaign, selected, onSelect,
                      }: {
    campaign: DonationCampaign;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <motion.button
            onClick={onSelect}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                selected
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
            }`}
        >
            {campaign.banner && (
                <div className="relative h-32 bg-muted">
                    <Image
                        src={campaign.banner}
                        alt={campaign.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {selected && (
                        <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                        {campaign.title}
                    </h4>
                    {!campaign.banner && selected && (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                </div>
                <ProgressBar raised={campaign.raised_amount} goal={campaign.goal_amount} />
            </div>
        </motion.button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DonatePage() {
    const [amount, setAmount] = useState<number>(50);
    const [customAmount, setCustomAmount] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [gateway, setGateway] = useState<DonationGateway>("stripe");
    const [campaignId, setCampaignId] = useState<string>("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [message, setMessage] = useState("");
    const [step, setStep] = useState<"amount" | "details" | "success">("amount");

    const scrollY = useMotionValue(0);
    const heroY = useTransform(scrollY, [0, 600], ["0%", "20%"]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    useEffect(() => {
        const update = () => scrollY.set(window.scrollY);
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, [scrollY]);

    const { data: campaignsData} = useCampaigns({ status: "active" });
    const { mutate: donate, isPending } = useDonate();

    const campaigns = campaignsData?.results ?? [];
    const finalAmount = isCustom ? parseFloat(customAmount) || 0 : amount;
    const impact = IMPACTS.findLast((i) => i.amount <= finalAmount);

    const handlePreset = (val: number) => {
        setAmount(val);
        setIsCustom(false);
        setCustomAmount("");
    };

    const handleCustom = (val: string) => {
        setCustomAmount(val);
        setIsCustom(true);
    };

    const handleDonate = () => {
        if (finalAmount < 1) {
            toast.error("Please enter a valid amount.");
            return;
        }
        donate(
            {
                amount: finalAmount,
                gateway,
                campaign: campaignId || undefined,
                is_anonymous: isAnonymous,
                message: message || undefined,
            },
            {
                onSuccess: () => setStep("success"),
                onError: () => toast.error("Donation failed. Please try again."),
            }
        );
    };

    return (
        <div className="min-h-screen bg-background">

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section suppressHydrationWarning className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-neutral-950">
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1600&q=80')",
                        y: heroY,
                        opacity: 0.22,
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(123,82,171,0.8)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-transparent to-neutral-950/90" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <motion.div
                    className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white"
                    style={{ opacity: heroOpacity }}
                >
                    <motion.div
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                    >
                        <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Make a difference today</span>
                    </motion.div>

                    <motion.h1
                        className="font-display font-extralight leading-[1.06] tracking-tight mb-5"
                        style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        Every gift{" "}
                        <motion.span
                            className="italic text-amber-200"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            protects
                        </motion.span>
                        <br />a child
                    </motion.h1>

                    <motion.p
                        className="mx-auto max-w-md text-base text-white/50 font-light leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                    >
                        Your generosity directly funds education, shelter, health, and protection
                        for vulnerable children across Cameroon.
                    </motion.p>
                </motion.div>

                {/* Scroll cue */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                >
                    <motion.div
                        className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent"
                        style={{ originY: 0 }}
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </section>

            {/* ── TRUST SIGNALS ─────────────────────────────────────────── */}
            <div className="border-b border-border bg-muted/20">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {TRUST_SIGNALS.map(({ icon: Icon, label, sub }, i) => (
                            <motion.div
                                key={label}
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.4 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-foreground leading-none mb-0.5">{label}</p>
                                    <p className="text-[11px] text-muted-foreground font-light">{sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MAIN ──────────────────────────────────────────────────── */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 mb-16">
                <AnimatePresence mode="wait">
                    {step === "success" ? (
                        /* ── SUCCESS STATE ────────────────────────────── */
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mx-auto max-w-lg text-center py-20"
                        >
                            <motion.div
                                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.6 }}
                            >
                                <Heart className="h-10 w-10 text-primary fill-primary" />
                            </motion.div>
                            <h2 className="font-display text-3xl font-light text-foreground mb-3 tracking-tight">
                                Thank you!
                            </h2>
                            <p className="text-muted-foreground font-light leading-relaxed mb-8">
                                Your donation of <span className="font-semibold text-foreground">${finalAmount}</span> is making a real difference. A receipt has been sent to your email.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button asChild variant="outline" className="rounded-full px-6">
                                    <Link href="/programs">View Programs</Link>
                                </Button>
                                <Button className="rounded-full px-6" onClick={() => setStep("amount")}>
                                    Donate Again
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid gap-10 lg:grid-cols-[1fr_400px]"
                        >
                            {/* ── LEFT: FORM ────────────────────────────── */}
                            <div className="space-y-8">

                                {/* Step 1 — Amount */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    viewport={{ once: false }}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <h2 className="font-display text-xl font-light text-foreground mb-1 tracking-tight">
                                        Choose an amount
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-light mb-6">
                                        All amounts in USD. One-time donation.
                                    </p>

                                    {/* Preset grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {PRESETS.map((p) => (
                                            <motion.button
                                                key={p}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handlePreset(p)}
                                                className={`rounded-xl border py-3 text-sm font-semibold transition-all duration-200 ${
                                                    !isCustom && amount === p
                                                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                                                        : "border-border bg-background text-foreground hover:border-primary/50"
                                                }`}
                                            >
                                                ${p}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Custom amount */}
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                                        <Input
                                            type="number"
                                            placeholder="Custom amount"
                                            value={customAmount}
                                            onChange={(e) => handleCustom(e.target.value)}
                                            className={`pl-8 rounded-xl transition-all ${isCustom ? "border-primary ring-1 ring-primary" : ""}`}
                                        />
                                    </div>

                                    {/* Impact indicator */}
                                    <AnimatePresence mode="wait">
                                        {impact && finalAmount > 0 && (
                                            <motion.div
                                                key={impact.label}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.25 }}
                                                className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3"
                                            >
                                                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                                <p className="text-sm text-foreground font-light">
                                                    <span className="font-semibold text-primary">${finalAmount}</span> can{" "}
                                                    {impact.label.toLowerCase()}.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Step 2 — Campaign */}
                                {campaigns.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        viewport={{ once: false }}
                                        className="rounded-2xl border border-border bg-card p-6"
                                    >
                                        <h2 className="font-display text-xl font-light text-foreground mb-1 tracking-tight">
                                            Support a campaign
                                        </h2>
                                        <p className="text-sm text-muted-foreground font-light mb-5">
                                            Optional — direct your gift to a specific cause.
                                        </p>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {/* General option */}
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setCampaignId("")}
                                                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                                                    campaignId === ""
                                                        ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary bg-primary/5"
                                                        : "border-border hover:border-primary/40"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 mb-1">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Heart className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground">General Fund</span>
                                                    {campaignId === "" && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-light pl-11">
                                                    {`Where it's needed most`}
                                                </p>
                                            </motion.button>

                                            {campaigns.map((c) => (
                                                <CampaignCard
                                                    key={c.id}
                                                    campaign={c}
                                                    selected={campaignId === c.id}
                                                    onSelect={() => setCampaignId(c.id)}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3 — Payment & details */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.15 }}
                                    viewport={{ once: false }}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <h2 className="font-display text-xl font-light text-foreground mb-1 tracking-tight">
                                        Payment method
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-light mb-5">
                                        {`Choose how you'd like to give.`}
                                    </p>

                                    <div className="flex gap-3 mb-6">
                                        {GATEWAYS.map((g) => (
                                            <button
                                                key={g.id}
                                                onClick={() => setGateway(g.id)}
                                                className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                                    gateway === g.id
                                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                        : "border-border text-foreground hover:border-primary/40"
                                                }`}
                                            >
                                                <span>{g.icon}</span>
                                                {g.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message */}
                                    <div className="mb-4">
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            Leave a message <span className="text-muted-foreground font-light">(optional)</span>
                                        </label>
                                        <Textarea
                                            placeholder="Share why you're giving today…"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={3}
                                            className="resize-none rounded-xl"
                                        />
                                    </div>

                                    {/* Anonymous toggle */}
                                    <button
                                        onClick={() => setIsAnonymous((v) => !v)}
                                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 w-full text-left transition-all duration-200 ${
                                            isAnonymous
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/30"
                                        }`}
                                    >
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            isAnonymous ? "border-primary bg-primary" : "border-muted-foreground"
                                        }`}>
                                            {isAnonymous && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Donate anonymously</p>
                                            <p className="text-xs text-muted-foreground font-light">{`Your name won't appear publicly`}</p>
                                        </div>
                                    </button>
                                </motion.div>
                            </div>

                            {/* ── RIGHT: SUMMARY ────────────────────────── */}
                            <div className="lg:sticky lg:top-24 h-fit space-y-4">

                                {/* Summary card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                    viewport={{ once: false }}
                                    className="rounded-2xl border border-border bg-card p-6"
                                >
                                    <h3 className="font-display text-lg font-light text-foreground mb-5 tracking-tight">
                                        Donation summary
                                    </h3>

                                    <div className="space-y-3 mb-5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-light">Amount</span>
                                            <span className="font-semibold text-foreground">
                                                {finalAmount > 0 ? `$${finalAmount}` : "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-light">Campaign</span>
                                            <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                                                {campaignId
                                                    ? campaigns.find((c) => c.id === campaignId)?.title ?? "—"
                                                    : "General Fund"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-light">Payment</span>
                                            <span className="font-medium text-foreground capitalize">{gateway}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-light">Anonymous</span>
                                            <span className="font-medium text-foreground">{isAnonymous ? "Yes" : "No"}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-4 mb-5">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-foreground">Total</span>
                                            <span className="font-bold text-2xl text-primary">
                                                {finalAmount > 0 ? `$${finalAmount}` : "$0"}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full rounded-xl h-12 text-base font-medium gap-2"
                                        onClick={handleDonate}
                                        disabled={isPending || finalAmount < 1}
                                    >
                                        {isPending ? (
                                            <span className="flex items-center gap-2">
                                                <motion.div
                                                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                />
                                                Processing…
                                            </span>
                                        ) : (
                                            <>
                                                <Heart className="h-4 w-4" />
                                                Donate ${finalAmount > 0 ? finalAmount : ""}
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                        <Lock className="h-3 w-3" />
                                        Secured by SSL encryption
                                    </div>
                                </motion.div>

                                {/* Testimonial */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    viewport={{ once: false }}
                                    className="rounded-2xl border border-border bg-muted/30 p-5"
                                >
                                    <div className="flex gap-0.5 mb-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-light leading-relaxed italic mb-3">
                                        {`"Supporting HOVUCA has been one of the most meaningful things I've done. Knowing my contribution goes directly to children in need is deeply fulfilling."`}                                    </p>
                                    <p className="text-xs font-semibold text-foreground">— Marie T., Monthly Donor</p>
                                </motion.div>

                                {/* Stats */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.15 }}
                                    viewport={{ once: false }}
                                    className="grid grid-cols-3 gap-3"
                                >
                                    {[
                                        { val: "5K+", label: "Children helped" },
                                        { val: "98%", label: "Funds to programs" },
                                        { val: "15+", label: "Years active" },
                                    ].map(({ val, label }) => (
                                        <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                                            <p className="font-display text-lg font-semibold text-primary">{val}</p>
                                            <p className="text-[10px] text-muted-foreground font-light leading-tight">{label}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}