"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, Copy, Loader2, Smartphone, Wallet } from "lucide-react";
import { donationsService } from "@/services";

const methods = [
    { id: "bank", label: "Direct bank transfer", icon: Building2 },
    { id: "paypal", label: "PayPal", icon: Wallet },
    { id: "mtn", label: "MTN MoMo", icon: Smartphone },
    { id: "orange", label: "Orange Money", icon: Smartphone },
] as const;
type Method = typeof methods[number]["id"];
const actionClass = "inline-flex min-h-12 items-center justify-center gap-3 bg-[#183b35] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#102c28] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]";

function httpsUrl(value: string | undefined) {
    if (!value) return null;
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; }
    catch { return null; }
}

export default function DonationMethods() {
    const [method, setMethod] = useState<Method>("bank");
    const [copyStatus, setCopyStatus] = useState("");
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["donation-payment-settings"], queryFn: donationsService.getPaymentSettings,
    });
    const mobile = method === "mtn" || method === "orange";
    const provider = method === "paypal" ? "PayPal" : "CamPay";
    const checkoutUrl = httpsUrl(method === "paypal" ? data?.paypal_url : data?.campay_url);
    const bankReady = Boolean(data?.bank_name && data.account_name && (data.account_number || data.iban));
    const bankDetails = data ? [
        ["Bank", data.bank_name], ["Account holder", data.account_name],
        ["Account number", data.account_number], ["IBAN", data.iban],
        ["SWIFT / BIC", data.swift_code], ["Currency", data.bank_currency],
    ].filter(([, value]) => value) : [];

    async function copyBankDetails() {
        try { await navigator.clipboard.writeText(bankDetails.map(([label, value]) => `${label}: ${value}`).join("\n")); setCopyStatus("Bank details copied."); }
        catch { setCopyStatus("Copying was unavailable. Please select and copy the bank details above."); }
    }

    return <div>
        <fieldset><legend className="font-display text-2xl font-bold">Choose a payment method</legend><div className="mt-6 grid gap-3 sm:grid-cols-2">{methods.map(({ id, label, icon: Icon }) => <label key={id} className={`flex min-h-16 cursor-pointer items-center gap-3 border px-4 py-4 transition-colors ${method === id ? "border-[#183b35] bg-[#edf2ed]" : "border-[#183b35]/25 bg-white hover:bg-[#f6f3eb]"}`}><input type="radio" name="donation-method" value={id} checked={method === id} onChange={() => { setMethod(id); setCopyStatus(""); }} aria-controls="payment-details" className="size-4 accent-[#183b35]" /><Icon aria-hidden="true" className="size-5 shrink-0" /><span className="font-semibold">{label}</span></label>)}</div></fieldset>
        <div id="payment-details" className="mt-8 border-t border-[#183b35]/20 pt-8">
            {isLoading ? <p role="status" className="flex items-center gap-3 py-4"><Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Loading payment details…</p>
            : isError ? <div role="alert"><p className="leading-7">We couldn’t load the donation details. Please try again.</p><button type="button" onClick={() => void refetch()} className={`mt-5 ${actionClass}`}>Try again</button></div>
            : method === "bank" && bankReady ? <div><h3 className="font-display text-3xl font-bold">Give by bank transfer</h3><p className="mt-4 leading-7 text-[#53645f]">Use these details in your banking app or at your bank. Please check the account holder before confirming your transfer.</p><dl className="mt-6 divide-y divide-[#183b35]/15 border-y border-[#183b35]/15">{bankDetails.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4"><dt className="text-sm text-[#53645f]">{label}</dt><dd className="break-all font-semibold">{value}</dd></div>)}</dl>{data?.bank_instructions && <p className="mt-5 whitespace-pre-line leading-7 text-[#53645f]">{data.bank_instructions}</p>}<button type="button" onClick={() => void copyBankDetails()} className={`mt-6 ${actionClass}`}><Copy aria-hidden="true" className="size-4" />Copy bank details</button><p role="status" className="mt-3 text-sm leading-6">{copyStatus}</p></div>
            : method !== "bank" && checkoutUrl ? <div><h3 className="font-display text-3xl font-bold">{mobile ? `Give with ${method === "mtn" ? "MTN MoMo" : "Orange Money"}` : "Give with PayPal"}</h3><p className="mt-4 leading-7 text-[#53645f]">{mobile ? `Continue to CamPay and select ${method === "mtn" ? "MTN Mobile Money" : "Orange Money"} at checkout. Follow the instructions there to confirm your payment.` : "Continue to PayPal to choose your donation amount and complete your payment."}</p><a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className={`mt-6 ${actionClass}`}>Continue to {provider}<ArrowUpRight aria-hidden="true" className="size-4" /><span className="sr-only"> (opens in a new tab)</span></a><p className="mt-4 text-sm leading-6 text-[#53645f]">Confirm the recipient, amount and currency on {provider} before paying.</p></div>
            : <div><h3 className="font-display text-2xl font-bold">{methods.find((item) => item.id === method)?.label}</h3><p className="mt-4 leading-7 text-[#53645f]">This donation method is currently unavailable. Contact our team for help arranging your donation.</p><Link href="/contact" className={`mt-6 ${actionClass}`}>Contact the team</Link></div>}
        </div>
    </div>;
}
