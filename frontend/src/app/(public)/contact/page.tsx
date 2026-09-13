"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Clock, HeartHandshake, Mail, MapPin, MessageSquare, Phone, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

const contactMethods = [
    { icon: Mail, label: "Email", value: "contact@hovuca.org", href: "mailto:contact@hovuca.org" },
    { icon: Phone, label: "Phone", value: "+237 696 230 391", href: "tel:+237696230391" },
    { icon: MapPin, label: "Head office", value: "Grande Chefferie Simbock, Yaoundé, Cameroon", href: "" },
    { icon: Clock, label: "Office hours", value: "Monday to Friday, 9am to 5pm", href: "#map" },
];

const reasons = [
    { icon: MessageSquare, title: "General enquiry", description: "Questions about our work or programs." },
    { icon: HeartHandshake, title: "Partnership", description: "Funding, collaboration or co-programming." },
    { icon: Users, title: "Volunteering", description: "Ways to contribute your time and skills." },
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [activeReason, setActiveReason] = useState(0);
    const [opened, setOpened] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const subject = form.subject || reasons[activeReason].title;
        const body = `${form.message}\n\nFrom: ${form.name}\nEmail: ${form.email}`;
        window.location.href = `mailto:contact@hovuca.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setOpened(true);
    };

    return (
        <main className="min-h-screen bg-[#fbfaf8] text-neutral-900">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-8 md:py-20 lg:grid-cols-[1fr_430px] lg:items-end">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5d2d84]">Contact HOVUCA</p>
                        <h1 className="mt-4 font-display text-5xl font-extrabold tracking-[-0.045em] sm:text-6xl">Let’s talk.</h1>
                    </div>
                    <p className="text-lg leading-8 text-neutral-600">Whether you want to partner, volunteer or learn more about our work, we would be glad to hear from you.</p>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
                <div className="grid divide-y divide-neutral-200 border-y border-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    {contactMethods.map(({ icon: Icon, label, value, href }) => (
                        <a key={label} href={href} {...(!href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("tel:") ? { target: "_blank", rel: "noreferrer" } : {})} className="group p-6 transition hover:bg-white lg:p-7">
                            <Icon className="h-5 w-5 text-[#5d2d84]" />
                            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
                            <p className="mt-2 text-sm font-bold leading-6 group-hover:text-[#5d2d84]">{value}</p>
                        </a>
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 sm:px-8 md:pb-20 lg:grid-cols-[1fr_360px] lg:gap-20">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#5d2d84]">Send a message</p>
                    <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">What can we help with?</h2>
                    <form onSubmit={handleSubmit} className="mt-9 space-y-5">
                        <div className="flex flex-wrap gap-2">
                            {reasons.map(({ icon: Icon, title }, index) => (
                                <button key={title} type="button" onClick={() => setActiveReason(index)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeReason === index ? "border-[#35145f] bg-[#35145f] text-white" : "border-neutral-300 bg-white text-neutral-600 hover:border-[#5d2d84]"}`}><Icon className="h-4 w-4" />{title}</button>
                            ))}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="text-sm font-bold">Full name<input name="name" required value={form.name} onChange={handleChange} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5d2d84] focus:ring-2 focus:ring-[#5d2d84]/10" /></label>
                            <label className="text-sm font-bold">Email address<input name="email" type="email" required value={form.email} onChange={handleChange} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5d2d84] focus:ring-2 focus:ring-[#5d2d84]/10" /></label>
                        </div>
                        <label className="block text-sm font-bold">Subject<input name="subject" value={form.subject} onChange={handleChange} placeholder={reasons[activeReason].title} className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5d2d84] focus:ring-2 focus:ring-[#5d2d84]/10" /></label>
                        <label className="block text-sm font-bold">Message<textarea name="message" required rows={7} value={form.message} onChange={handleChange} className="mt-2 w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 font-normal outline-none focus:border-[#5d2d84] focus:ring-2 focus:ring-[#5d2d84]/10" /></label>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-neutral-500">This opens your email application.</p>
                            <Button type="submit" className="bg-[#35145f] px-6 hover:bg-[#4d2477]"><Send className="mr-2 h-4 w-4" />Prepare email</Button>
                        </div>
                        {opened && <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Your email application should now be open with the message prepared.</p>}
                    </form>
                </div>

                <aside className="space-y-6 lg:pt-16">
                    <div className="rounded-xl border border-neutral-200 bg-white p-7">
                        <h3 className="font-display text-xl font-extrabold">Why contact us?</h3>
                        <div className="mt-6 space-y-6">{reasons.map(({ icon: Icon, title, description }) => <div key={title} className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee7f3] text-[#35145f]"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p></div></div>)}</div>
                    </div>
                    <Link href="/donate" className="group flex items-center justify-between rounded-xl bg-[#35145f] p-6 font-bold text-white">Support our work <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></Link>
                </aside>
            </section>

            <section id="map" className="relative h-[440px] border-t border-neutral-200 bg-neutral-200">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127580.87349843!2d11.4611!3d3.8480!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf703a599ef3%3A0xa77e6c1ce2e17c57!2sYaound%C3%A9%2C%20Cameroon!5e0!3m2!1sen!2s!4v1680000000000" width="100%" height="100%" style={{ border: 0, filter: "grayscale(1)" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="HOVUCA head office in Yaoundé, Cameroon" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#fbfaf8] to-transparent" />
            </section>
        </main>
    );
}
