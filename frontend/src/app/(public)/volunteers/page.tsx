import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import VolunteerApplication from "@/components/volunteers/VolunteerApplication";

export const metadata: Metadata = {
    title: "Volunteer with us",
    description: "Apply to volunteer with HOVUCA. Share your information, skills and availability to support community-led work in Cameroon.",
};

const contributions = [
    { title: "Learning & mentorship", description: "Tell us about your experience in teaching, mentoring or helping young people develop practical skills." },
    { title: "Community participation", description: "Share your interest in community engagement, awareness activities and working alongside local teams." },
    { title: "Skills behind the scenes", description: "Writing, research, design, technology and administration can all be part of the conversation." },
];

const questions = [
    { question: "Do I need previous volunteering experience?", answer: "Use the application to describe your skills, interests and experience, including anything you would like to learn. The team can discuss what may be a suitable fit." },
    { question: "Can I volunteer remotely?", answer: "Tell the team where you are based and whether you are interested in remote or in-person work. The arrangement will depend on the activity and the team's needs." },
    { question: "How much time should I commit?", answer: "Share the time you can realistically offer in your introduction. Discuss a commitment with the team before taking on any tasks." },
    { question: "Does submitting an application guarantee a placement?", answer: "No. An application records your interest and skills. Activities and assignments depend on available work and a discussion with the team." },
    { question: "Do I need an account to apply?", answer: "No. Fill in the form on this page and submit your application directly. Make sure your email address and phone number are correct so the team can contact you." },
];

export default function VolunteersPage() {
    return (
        <div className="bg-background text-[#183b35]">
            <section aria-labelledby="volunteer-heading" className="grid lg:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr]">
                <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-[max(2.5rem,calc((100vw-1280px)/2))] lg:pr-12 lg:py-20">
                    <h1 id="volunteer-heading" className="max-w-xl font-display text-5xl font-bold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl">Your skills.<br />Our shared future.</h1>
                    <p className="mt-7 max-w-lg text-lg leading-8 text-[#53645f]">Volunteer with HOVUCA and contribute to community-led work with children, girls and young people in Cameroon.</p>
                    <div className="mt-9 flex flex-wrap items-center gap-5">
                        <a href="#volunteer-profile" className="inline-flex min-h-12 items-center gap-6 bg-[#d85c43] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b84733] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35]">Get involved <ArrowRight aria-hidden="true" className="size-5" /></a>
                        <Link href="/programs" className="py-3 font-semibold underline decoration-[#e0aa18] underline-offset-8 hover:text-[#b84733]">Explore our work</Link>
                    </div>
                </div>
                <div className="relative min-h-80 sm:min-h-[460px] lg:min-h-full">
                    <Image src="/assets/plates/hero-photo.webp" alt="Young people participating in a community discussion" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
                </div>
            </section>

            <section aria-labelledby="contribute-heading" className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:py-24">
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                    <div>
                        <h2 id="contribute-heading" className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">There is more than<br className="hidden sm:block" /> one way to contribute.</h2>
                        <p className="mt-6 max-w-md leading-7 text-[#53645f]">Start with what you know and what matters to you. These are areas to discuss with our team, rather than a list of currently open positions.</p>
                    </div>
                    <div className="border-t border-[#183b35]/20">
                        {contributions.map((item) => <div key={item.title} className="border-b border-[#183b35]/20 py-7"><h3 className="font-display text-2xl font-bold">{item.title}</h3><p className="mt-3 max-w-xl leading-7 text-[#53645f]">{item.description}</p></div>)}
                    </div>
                </div>
            </section>

            <section aria-labelledby="approach-heading" className="bg-[#183b35] text-white">
                <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
                    <h2 id="approach-heading" className="max-w-lg font-display text-4xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">Work alongside communities.<br />Listen first.</h2>
                    <div className="space-y-5 text-lg leading-8 text-white/85"><p>Our work centres the agency and dignity of children, young people and communities. Bring a willingness to listen, collaborate and respect the people you work with.</p><p>Before joining an activity, discuss the responsibilities, safeguarding expectations and practical arrangements with the team.</p><Link href="/about" className="inline-flex min-h-11 items-center gap-3 font-semibold text-white underline decoration-[#e0aa18] underline-offset-8">Get to know HOVUCA <ArrowRight aria-hidden="true" className="size-5" /></Link></div>
                </div>
            </section>

            <section id="volunteer-profile" aria-labelledby="profile-heading" className="mx-auto grid max-w-7xl scroll-mt-28 gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-24">
                <div>
                    <h2 id="profile-heading" className="font-display text-4xl font-bold tracking-[-0.02em] sm:text-5xl">Let’s start<br />with you.</h2>
                    <p className="mt-6 max-w-md leading-7 text-[#53645f]">Fill in the volunteer application and tell us what you can offer. No account is required. The team will have your information available for review.</p>
                    <ol className="mt-8 list-decimal space-y-4 pl-5 leading-7 text-[#53645f]"><li>Enter your contact information.</li><li>Share your skills, interests and availability.</li><li>Submit your application for review.</li></ol>
                    <Link href="/contact" className="mt-8 inline-flex min-h-11 items-center gap-3 font-semibold underline underline-offset-4 hover:text-[#b84733]">Talk to our team <ArrowRight aria-hidden="true" className="size-4" /></Link>
                </div>
                <VolunteerApplication />
            </section>

            <section aria-labelledby="questions-heading" className="border-t border-[#183b35]/20 bg-[#f6f3eb]">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-20">
                    <h2 id="questions-heading" className="font-display text-4xl font-bold tracking-[-0.02em]">Before you begin</h2>
                    <div>{questions.map((item) => <details key={item.question} className="group border-b border-[#183b35]/20 first:border-t"><summary className="cursor-pointer py-5 pr-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]">{item.question}</summary><p className="pb-6 leading-7 text-[#53645f]">{item.answer}</p></details>)}</div>
                </div>
            </section>
        </div>
    );
}
