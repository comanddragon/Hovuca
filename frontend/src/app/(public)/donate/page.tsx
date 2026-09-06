"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Heart, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCampaigns, useDonate } from "@/hooks";
import type { DonationCampaign, DonationGateway } from "@/types";

const PRESETS = [10, 25, 50, 100, 250, 500];
const GATEWAYS: { id: DonationGateway; label: string }[] = [
    { id: "stripe", label: "Card" },
    { id: "paypal", label: "PayPal" },
    { id: "manual", label: "Bank transfer" },
];

function CampaignCard({ campaign, selected, onSelect }: { campaign: DonationCampaign; selected: boolean; onSelect: () => void }) {
    const goal = Number(campaign.goal_amount);
    const raised = Number(campaign.raised_amount);
    const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

    return (
        <button type="button" onClick={onSelect} className={`overflow-hidden rounded-xl border bg-white text-left transition ${selected ? "border-[#35145f] ring-2 ring-[#35145f]/10" : "border-neutral-200 hover:border-neutral-400"}`}>
            {campaign.banner && <div className="relative h-32 bg-neutral-100"><Image src={campaign.banner} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" /></div>}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold leading-5">{campaign.title}</h3>{selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#35145f]" />}</div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-[#5d2d84]" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs text-neutral-500">${raised.toLocaleString()} raised of ${goal.toLocaleString()}</p>
            </div>
        </button>
    );
}

export default function DonatePage() {
    const [amount, setAmount] = useState(50);
    const [customAmount, setCustomAmount] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [gateway, setGateway] = useState<DonationGateway>("stripe");
    const [campaignId, setCampaignId] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [message, setMessage] = useState("");
    const [complete, setComplete] = useState(false);
    const { data } = useCampaigns({ status: "active" });
    const { mutate: donate, isPending } = useDonate();
    const campaigns = data?.results ?? [];
    const finalAmount = isCustom ? Number(customAmount) || 0 : amount;

    const choosePreset = (value: number) => {
        setAmount(value);
        setCustomAmount("");
        setIsCustom(false);
    };

    const submitDonation = () => {
        if (finalAmount < 1) {
            toast.error("Please enter a valid amount.");
            return;
        }
        donate({ amount: finalAmount, gateway, campaign: campaignId || undefined, is_anonymous: isAnonymous, message: message || undefined }, {
            onSuccess: () => setComplete(true),
            onError: () => toast.error("Donation could not be started. Please try again."),
        });
    };

    if (complete) {
        return (
            <main className="flex min-h-[70vh] items-center bg-[#fbfaf8] px-6 py-20">
                <div className="mx-auto max-w-lg text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eee7f3] text-[#35145f]"><Heart className="h-8 w-8 fill-current" /></div>
                    <h1 className="mt-7 font-display text-4xl font-extrabold tracking-tight">Thank you for your support.</h1>
                    <p className="mt-4 leading-7 text-neutral-600">Your ${finalAmount.toLocaleString()} donation has been submitted.</p>
                    <div className="mt-8 flex justify-center gap-3"><Button variant="outline" asChild><Link href="/programs">View programs</Link></Button><Button onClick={() => setComplete(false)} className="bg-[#35145f] hover:bg-[#4d2477]">Donate again</Button></div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#fbfaf8] text-neutral-900">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-8 md:py-20 lg:grid-cols-[1fr_430px] lg:items-end">
                    <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5d2d84]">Support HOVUCA</p><h1 className="mt-4 font-display text-5xl font-extrabold tracking-[-0.045em] sm:text-6xl">Give with purpose.</h1></div>
                    <p className="text-lg leading-8 text-neutral-600">Your contribution supports HOVUCA’s work with vulnerable children, girls and communities across Cameroon.</p>
                </div>
            </header>

            <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:px-8 md:py-20 lg:grid-cols-[1fr_360px] lg:items-start">
                <div className="space-y-8">
                    <section>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5d2d84]">Step 1</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Choose an amount</h2>
                        <p className="mt-2 text-sm text-neutral-500">One-time donation in US dollars.</p>
                        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">{PRESETS.map((value) => <button key={value} type="button" onClick={() => choosePreset(value)} className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${!isCustom && amount === value ? "border-[#35145f] bg-[#35145f] text-white" : "border-neutral-300 bg-white hover:border-[#5d2d84]"}`}>${value}</button>)}</div>
                        <label className="mt-4 block text-sm font-bold">Or enter another amount<div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span><Input type="number" min="1" value={customAmount} onChange={(event) => { setCustomAmount(event.target.value); setIsCustom(true); }} placeholder="Other amount" className="h-12 border-neutral-300 bg-white pl-8 focus-visible:ring-[#5d2d84]/20" /></div></label>
                    </section>

                    {campaigns.length > 0 && (
                        <section className="border-t border-neutral-200 pt-8">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5d2d84]">Step 2</p>
                            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Choose where it goes</h2>
                            <p className="mt-2 text-sm text-neutral-500">Leave this on the General Fund to support the area of greatest need.</p>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <button type="button" onClick={() => setCampaignId("")} className={`rounded-xl border bg-white p-5 text-left transition ${!campaignId ? "border-[#35145f] ring-2 ring-[#35145f]/10" : "border-neutral-200 hover:border-neutral-400"}`}><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">General Fund</h3><p className="mt-1 text-sm text-neutral-500">Use where it is needed most.</p></div>{!campaignId && <CheckCircle2 className="h-5 w-5 text-[#35145f]" />}</div></button>
                                {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} selected={campaignId === campaign.id} onSelect={() => setCampaignId(campaign.id)} />)}
                            </div>
                        </section>
                    )}

                    <section className="border-t border-neutral-200 pt-8">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5d2d84]">{campaigns.length > 0 ? "Step 3" : "Step 2"}</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Payment details</h2>
                        <div className="mt-6 grid grid-cols-3 gap-3">{GATEWAYS.map((option) => <button key={option.id} type="button" onClick={() => setGateway(option.id)} className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${gateway === option.id ? "border-[#35145f] bg-[#eee7f3] text-[#35145f]" : "border-neutral-300 bg-white hover:border-[#5d2d84]"}`}>{option.label}</button>)}</div>
                        <label className="mt-5 block text-sm font-bold">Message <span className="font-normal text-neutral-500">(optional)</span><Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-2 resize-none border-neutral-300 bg-white focus-visible:ring-[#5d2d84]/20" /></label>
                        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-300 bg-white p-4"><input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} className="mt-1 accent-[#35145f]" /><span><span className="block text-sm font-bold">Donate anonymously</span><span className="mt-1 block text-xs text-neutral-500">Your name will not be shown publicly.</span></span></label>
                    </section>
                </div>

                <aside className="rounded-xl border border-neutral-200 bg-white p-6 lg:sticky lg:top-24">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Donation summary</p>
                    <div className="mt-6 space-y-4 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-neutral-500">Amount</span><span className="font-bold">${finalAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-neutral-500">Fund</span><span className="max-w-[190px] text-right font-bold">{campaignId ? campaigns.find((campaign) => campaign.id === campaignId)?.title : "General Fund"}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-neutral-500">Method</span><span className="font-bold">{GATEWAYS.find((option) => option.id === gateway)?.label}</span></div>
                    </div>
                    <div className="my-6 border-t border-neutral-200" />
                    <div className="flex items-end justify-between"><span className="font-bold">Total</span><span className="font-display text-3xl font-extrabold text-[#35145f]">${finalAmount.toLocaleString()}</span></div>
                    <Button onClick={submitDonation} disabled={isPending || finalAmount < 1} className="mt-6 h-12 w-full bg-[#35145f] text-base font-bold hover:bg-[#4d2477]">{isPending ? "Processing..." : <>Donate now <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
                    <p className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500"><Lock className="h-3.5 w-3.5" />Payment details are handled by the selected provider.</p>
                </aside>
            </section>
        </main>
    );
}
