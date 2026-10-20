"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { contactService } from "@/services/contact.service";

const text = (max: number) => z.string().trim().min(1, "This field is required.").max(max);
const schema = z.object({
    full_name: text(200), email: z.string().trim().max(254).pipe(z.email("Enter a valid email address.")),
    phone: z.string().trim().max(40).refine(value => !value || /^(?=(?:\D*[0-9]){6})[+0-9\s().-]{6,40}$/.test(value), "Enter a valid phone number with country code."),
    topic: z.enum(["general", "partnership", "volunteering", "donations"]), subject: text(200), message: text(5000),
    contact_consent: z.boolean().refine(Boolean, "Please allow us to contact you about your enquiry."),
});
type FormValues = z.infer<typeof schema>;
const input = "mt-2 w-full border border-primary/30 bg-brand-white px-4 py-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-invalid:border-brand-error";
const button = "min-h-12 bg-primary px-6 py-3 font-semibold text-brand-white hover:bg-brand-forest-deep focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-60";

export default function ContactForm() {
    const { register, handleSubmit, setError, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { full_name: "", email: "", phone: "", topic: "general", subject: "", message: "", contact_consent: false } });
    const submission = useMutation({ mutationFn: contactService.submit, onError: error => {
        if (isAxiosError(error) && error.response?.status === 400 && error.response.data && typeof error.response.data === "object") {
            let focus = true;
            for (const [field, messages] of Object.entries(error.response.data)) if (field in schema.shape) {
                setError(field as keyof FormValues, { type: "server", message: Array.isArray(messages) ? messages.join(" ") : String(messages) }, { shouldFocus: focus }); focus = false;
            }
        }
    } });
    const attributes = (field: keyof FormValues) => ({ "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `contact-${field}-error` : undefined });
    const error = (field: keyof FormValues) => errors[field] && <span id={`contact-${field}-error`} role="alert" className="mt-2 block text-sm font-normal text-brand-error">{errors[field]?.message}</span>;
    if (submission.isSuccess) return <div role="status" className="border-y border-primary/20 py-10"><h3 className="font-display text-3xl font-bold">Your message is received.</h3><p className="mt-4 leading-7 text-muted-foreground">Thank you for getting in touch. Your enquiry has been saved for the HOVUCA team to review and respond using your contact details.</p><button className={`${button} mt-6`} onClick={() => { reset(); submission.reset(); }}>Send another enquiry</button></div>;
    return <form noValidate onSubmit={handleSubmit(values => submission.mutate(values))}><fieldset disabled={submission.isPending} className="space-y-6">
        <legend className="font-display text-3xl font-bold">Send us a message</legend><p className="text-sm leading-6 text-muted-foreground">All fields are required unless marked optional.</p>
        <div className="grid gap-5 sm:grid-cols-2">{(["full_name", "email", "phone"] as const).map(field => <label key={field} htmlFor={`contact-${field}`} className="block font-semibold">{{ full_name: "Full name", email: "Email address", phone: "Phone number (optional)" }[field]}<input id={`contact-${field}`} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} autoComplete={{ full_name: "name", email: "email", phone: "tel" }[field]} maxLength={field === "phone" ? 40 : field === "email" ? 254 : 200} {...register(field)} {...attributes(field)} className={input} />{error(field)}</label>)}<label htmlFor="contact-topic" className="block font-semibold">What is your enquiry about?<select id="contact-topic" {...register("topic")} {...attributes("topic")} className={input}><option value="general">General enquiry</option><option value="partnership">Partnership</option><option value="volunteering">Volunteering</option><option value="donations">Donations</option></select>{error("topic")}</label></div>
        <label htmlFor="contact-subject" className="block font-semibold">Subject<input id="contact-subject" maxLength={200} {...register("subject")} {...attributes("subject")} className={input} />{error("subject")}</label>
        <label htmlFor="contact-message" className="block font-semibold">Your message<textarea id="contact-message" rows={6} maxLength={5000} {...register("message")} {...attributes("message")} className={input} />{error("message")}</label>
        <p className="text-sm leading-6 text-muted-foreground">Please do not include passwords, payment PINs, or card details.</p>
        <div><label htmlFor="contact-consent" className="flex items-start gap-3 text-sm leading-6"><input id="contact-consent" type="checkbox" {...register("contact_consent")} {...attributes("contact_consent")} className="mt-1 size-4 shrink-0 accent-primary" /><span>I agree that HOVUCA may use my information to respond to this enquiry.</span></label>{error("contact_consent")}</div>
        {submission.isError && <p role="alert" className="border border-brand-error bg-brand-error-surface p-4 text-sm text-brand-error">{isAxiosError(submission.error) && submission.error.response?.status === 429 ? "Too many attempts. Please wait before trying again." : "Your message could not be sent. Check any highlighted fields or try again. Your information is still in the form."}</p>}
        <button type="submit" disabled={submission.isPending} className={button}>{submission.isPending ? "Sending…" : "Send message"}</button>
    </fieldset></form>;
}
