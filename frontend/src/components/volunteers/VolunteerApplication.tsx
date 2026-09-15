"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useVolunteerMe } from "@/hooks";
import { volunteersService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import { authPath } from "@/lib/auth-return";
import type { AvailabilityStatus, VolunteerProfile } from "@/types";

const returnPath = "/volunteers#volunteer-profile";
const actionClass = "inline-flex min-h-12 items-center justify-center gap-3 bg-[#183b35] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#102c28] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#183b35] disabled:cursor-not-allowed disabled:opacity-60";
const fieldClass = "mt-2 w-full border border-[#183b35]/30 bg-white px-4 py-3 font-normal text-[#183b35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183b35]";

function ProfileForm({ profile }: { profile?: VolunteerProfile }) {
    const queryClient = useQueryClient();
    const [bio, setBio] = useState(profile?.bio ?? "");
    const [skills, setSkills] = useState(profile?.skills.join(", ") ?? "");
    const [availability, setAvailability] = useState<AvailabilityStatus>(profile?.availability ?? "available");
    const save = useMutation({
        mutationFn: (payload: Partial<VolunteerProfile>) => profile
            ? volunteersService.updateProfile(profile.id, payload)
            : volunteersService.createProfile(payload),
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["volunteer-me"] }); },
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        save.mutate({ bio: bio.trim(), skills: [...new Set(skills.split(",").map((skill) => skill.trim()).filter(Boolean))], availability });
    }

    return <form onSubmit={submit}>
        <fieldset disabled={save.isPending} className="space-y-6">
        <h3 className="font-display text-2xl font-bold">{profile ? "Your volunteer profile" : "Create your volunteer profile"}</h3>
        <label className="block font-semibold" htmlFor="volunteer-bio">Introduce yourself<textarea id="volunteer-bio" required maxLength={5000} rows={5} value={bio} onChange={(event) => { setBio(event.target.value); save.reset(); }} className={fieldClass} aria-describedby="volunteer-bio-hint" /><span id="volunteer-bio-hint" className="mt-2 block text-sm font-normal leading-6 text-[#53645f]">Share your interests, experience, location and the time you can offer.</span></label>
        <label className="block font-semibold" htmlFor="volunteer-skills">Your skills<input id="volunteer-skills" required maxLength={1000} value={skills} onChange={(event) => { setSkills(event.target.value); save.reset(); }} className={fieldClass} aria-describedby="volunteer-skills-hint" /><span id="volunteer-skills-hint" className="mt-2 block text-sm font-normal text-[#53645f]">Separate skills with commas, for example: writing, mentoring, design.</span></label>
        <label className="block font-semibold" htmlFor="volunteer-availability">Availability<select id="volunteer-availability" value={availability} onChange={(event) => { setAvailability(event.target.value as AvailabilityStatus); save.reset(); }} className={fieldClass}><option value="available">Available to volunteer</option><option value="busy">Currently busy</option><option value="inactive">Not currently available</option></select></label>
        {save.isError && <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800">We couldn’t save your profile. Please try again. If you already have a profile, reload this page before trying again.</p>}
        {save.isSuccess && <p role="status" className="flex gap-3 bg-[#edf3ee] p-4 text-sm leading-6"><CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />Your profile has been saved. Contact the team to discuss ways to get involved.</p>}
        <div className="flex flex-wrap items-center gap-5"><button type="submit" disabled={save.isPending || !bio.trim() || !skills.split(",").some((skill) => skill.trim())} className={actionClass}>{save.isPending ? <><Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Saving…</> : profile ? "Save changes" : "Save volunteer profile"}</button>{profile && <Link href="/dashboard/volunteer" className="py-3 font-semibold underline underline-offset-4">Open volunteer hub</Link>}</div>
        </fieldset>
    </form>;
}

export default function VolunteerApplication() {
    const { isAuthenticated, isHydrated, user } = useAuthStore();
    const { data: profile, isLoading, error, refetch } = useVolunteerMe();
    if (!isHydrated || (isAuthenticated && user?.role === "volunteer" && isLoading)) return <div role="status" className="flex items-center gap-3 py-8"><Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />Loading volunteer profile…</div>;

    if (!isAuthenticated) return <div className="border-y border-[#183b35]/20 py-8"><h3 className="font-display text-3xl font-bold">A little time can be a start.</h3><p className="mt-4 leading-7 text-[#53645f]">Create an account to save your profile. We’ll select the volunteer role for you, and bring you back here after registration.</p><div className="mt-7 flex flex-wrap items-center gap-5"><Link href={`${authPath("/register", returnPath)}&role=volunteer`} className={actionClass}>Create an account <ArrowRight aria-hidden="true" className="size-4" /></Link><Link href={authPath("/login", returnPath)} className="py-3 font-semibold underline underline-offset-4">Sign in</Link></div></div>;

    if (user?.role !== "volunteer") return <div className="border-y border-[#183b35]/20 py-8"><h3 className="font-display text-2xl font-bold">Interested in volunteering?</h3><p className="mt-4 leading-7 text-[#53645f]">Your account currently uses the {user?.role} role. Contact the team to discuss becoming a volunteer and updating your account.</p><Link href="/contact" className={`mt-6 ${actionClass}`}>Contact the team <ArrowRight aria-hidden="true" className="size-4" /></Link></div>;

    if (error && !(isAxiosError(error) && error.response?.status === 404)) return <div role="alert" className="border-y border-[#183b35]/20 py-8"><p className="leading-7">We couldn’t load your profile. Please retry before making changes.</p><button type="button" onClick={() => void refetch()} className={`mt-5 ${actionClass}`}>Try again</button></div>;

    return <ProfileForm key={user.id} profile={profile} />;
}
