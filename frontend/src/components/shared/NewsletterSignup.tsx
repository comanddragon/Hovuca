"use client";

import { useState, type SubmitEvent } from "react";
import { ArrowRight, Check } from "lucide-react";

import { blogService } from "@/services/blog.service";

export function NewsletterSignup() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const subscribe = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus("submitting");
        setMessage("");
        try {
            const response = await blogService.subscribeNewsletter(email);
            setStatus("success");
            setMessage(response.detail);
            setEmail("");
        } catch {
            setStatus("error");
            setMessage("We could not subscribe you right now. Please try again.");
        }
    };

    if (status === "success") {
        return <div className="mt-6 border border-primary/20 bg-brand-white px-5 py-4 text-sm text-primary" role="status"><span className="flex items-center gap-2 font-semibold"><Check className="size-4" aria-hidden="true" /> {message}</span></div>;
    }

    return <form onSubmit={subscribe} className="mt-6"><label className="sr-only" htmlFor="newsletter-email">Email address</label><div className="flex flex-col gap-3 sm:flex-row"><input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required disabled={status === "submitting"} className="min-h-11 min-w-0 flex-1 border border-primary/30 bg-brand-white px-4 text-sm text-primary placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:opacity-60" /><button type="submit" disabled={status === "submitting"} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-forest-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold disabled:cursor-not-allowed disabled:opacity-60">{status === "submitting" ? "Subscribing…" : <>Subscribe <ArrowRight className="size-4" aria-hidden="true" /></>}</button></div><p className="mt-3 text-xs leading-5 text-muted-foreground">One thoughtful update a month. To opt out, contact HOVUCA.</p>{status === "error" && <p className="mt-2 text-sm text-destructive" role="alert">{message}</p>}</form>;
}
