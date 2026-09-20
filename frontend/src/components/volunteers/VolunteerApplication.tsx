"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { volunteersService } from "@/services";
import { useAuthStore } from "@/store/auth.store";

const requiredText = (limit: number) => z.string().trim().min(1, "This field is required.").max(limit, `Use no more than ${limit} characters.`);
const schema = z.object({
    full_name: requiredText(200),
    email: z.email("Enter a valid email address.").trim().max(254),
    phone: requiredText(40).regex(/^(?=(?:\D*[0-9]){6})[+0-9\s().-]{6,40}$/, "Enter a valid phone number, including your country code."),
    location: requiredText(200),
    occupation: z.string().trim().max(200),
    skills: requiredText(5000),
    interests: requiredText(200),
    availability: requiredText(200),
    hours_per_week: z.number().int("Use a whole number.").min(1, "Enter at least 1 hour.").max(168, "Enter no more than 168 hours."),
    motivation: requiredText(5000),
    contact_consent: z.boolean().refine(Boolean, "Please allow the team to contact you about your application."),
});
type ApplicationForm = z.infer<typeof schema>;
const fieldClass = "mt-2 w-full border border-[var(--brand-forest)]/30 bg-white px-4 py-3 font-normal text-[var(--brand-forest)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-forest)] aria-invalid:border-red-600";
const actionClass = "inline-flex min-h-12 items-center justify-center gap-3 bg-[var(--brand-forest)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-forest-deep)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-forest)] disabled:cursor-not-allowed disabled:opacity-60";

export default function VolunteerApplication() {
    const user = useAuthStore((state) => state.user);
    const { register, handleSubmit, setError, formState: { errors } } = useForm<ApplicationForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            full_name: user?.full_name ?? "",
            email: user?.email ?? "",
            phone: user?.phone_number ?? "",
            location: "", occupation: "", skills: "", interests: "", availability: "",
            hours_per_week: 2, motivation: "", contact_consent: false,
        },
    });
    const submission = useMutation({
        mutationFn: volunteersService.submitApplication,
        onError: (error) => {
            if (isAxiosError(error) && error.response?.status === 400) {
                const data: unknown = error.response.data;
                if (data && typeof data === "object") {
                    for (const [field, messages] of Object.entries(data)) {
                        if (field in schema.shape) setError(field as keyof ApplicationForm, {
                            type: "server", message: Array.isArray(messages) ? messages.join(" ") : String(messages),
                        }, { shouldFocus: true });
                    }
                }
            }
        },
    });
    const errorFor = (field: keyof ApplicationForm) => errors[field]
        ? <span id={`${field}-error`} role="alert" className="mt-2 block text-sm font-normal text-red-800">{errors[field]?.message}</span>
        : null;
    const accessibility = (field: keyof ApplicationForm) => ({
        "aria-invalid": Boolean(errors[field]),
        "aria-describedby": errors[field] ? `${field}-error` : undefined,
    });

    if (submission.isSuccess) return <div role="status" className="border-y border-[var(--brand-forest)]/20 py-10">
        <CheckCircle2 aria-hidden="true" className="size-10 text-[var(--brand-forest)]" />
        <h3 className="mt-5 font-display text-3xl font-bold">Application received.</h3>
        <p className="mt-4 leading-7 text-[var(--brand-body-muted)]">Thank you for offering your time and skills. Your application has been submitted for review. The team can use your contact details to discuss next steps.</p>
        <p className="mt-4 text-sm text-[var(--brand-body-muted)]">Submitting an application does not confirm a volunteer placement.</p>
    </div>;

    return <form onSubmit={handleSubmit((values) => submission.mutate(values))} noValidate className="border-t border-[var(--brand-forest)]/20 pt-8">
        <fieldset disabled={submission.isPending} className="space-y-6">
            <legend className="font-display text-3xl font-bold">Volunteer application</legend>
            <p className="text-sm leading-6 text-[var(--brand-body-muted)]">Tell us about yourself and how you would like to contribute. All fields are required unless marked optional.</p>
            <div className="grid gap-5 sm:grid-cols-2">
                <label className="block font-semibold" htmlFor="full_name">Full name<input id="full_name" autoComplete="name" maxLength={200} {...register("full_name")} {...accessibility("full_name")} className={fieldClass} />{errorFor("full_name")}</label>
                <label className="block font-semibold" htmlFor="email">Email address<input id="email" type="email" autoComplete="email" maxLength={254} {...register("email")} {...accessibility("email")} className={fieldClass} />{errorFor("email")}</label>
                <label className="block font-semibold" htmlFor="phone">Phone number<input id="phone" type="tel" autoComplete="tel" placeholder="Include your country code" maxLength={40} {...register("phone")} {...accessibility("phone")} className={fieldClass} />{errorFor("phone")}</label>
                <label className="block font-semibold" htmlFor="location">City and country<input id="location" autoComplete="address-level2" maxLength={200} {...register("location")} {...accessibility("location")} className={fieldClass} />{errorFor("location")}</label>
            </div>
            <label className="block font-semibold" htmlFor="occupation">Occupation or studies <span className="font-normal text-[var(--brand-body-muted)]">(optional)</span><input id="occupation" maxLength={200} {...register("occupation")} {...accessibility("occupation")} className={fieldClass} />{errorFor("occupation")}</label>
            <label className="block font-semibold" htmlFor="skills">Skills and experience<textarea id="skills" rows={4} maxLength={5000} {...register("skills")} {...accessibility("skills")} className={fieldClass} />{errorFor("skills")}</label>
            <label className="block font-semibold" htmlFor="interests">Where would you like to contribute?<select id="interests" {...register("interests")} {...accessibility("interests")} className={fieldClass}><option value="">Choose an area of interest</option><option value="Learning and mentorship">Learning and mentorship</option><option value="Community participation">Community participation</option><option value="Research and communications">Research and communications</option><option value="Technology and administration">Technology and administration</option><option value="Open to discussing options">Open to discussing options</option></select>{errorFor("interests")}</label>
            <div className="grid gap-5 sm:grid-cols-2">
                <label className="block font-semibold" htmlFor="availability">When are you available?<input id="availability" placeholder="For example: weekday evenings" maxLength={200} {...register("availability")} {...accessibility("availability")} className={fieldClass} />{errorFor("availability")}</label>
                <label className="block font-semibold" htmlFor="hours_per_week">Hours per week<input id="hours_per_week" type="number" min={1} max={168} step={1} {...register("hours_per_week", { valueAsNumber: true })} {...accessibility("hours_per_week")} className={fieldClass} />{errorFor("hours_per_week")}</label>
            </div>
            <label className="block font-semibold" htmlFor="motivation">Why would you like to volunteer?<textarea id="motivation" rows={5} maxLength={5000} {...register("motivation")} {...accessibility("motivation")} className={fieldClass} />{errorFor("motivation")}</label>
            <div><label htmlFor="contact_consent" className="flex items-start gap-3 text-sm leading-6"><input id="contact_consent" type="checkbox" {...register("contact_consent")} {...accessibility("contact_consent")} className="mt-1 size-4 shrink-0 accent-[var(--brand-forest)]" /><span>I agree that HOVUCA may use the information in this application to contact me about volunteering.</span></label>{errorFor("contact_consent")}</div>
            {submission.isError && <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800">{isAxiosError(submission.error) && submission.error.response?.status === 429 ? "Too many attempts. Please wait before submitting again." : "We couldn’t submit your application. Check the highlighted fields or try again. Your information is still in the form."}</p>}
            <button type="submit" disabled={submission.isPending} className={actionClass}>{submission.isPending ? <><Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />Submitting…</> : <><Send aria-hidden="true" className="size-4" />Submit application</>}</button>
        </fieldset>
    </form>;
}
