"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { toast } from "sonner";
import { useForgotPassword } from "@/hooks"; // adjust path if needed
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const schema = z.object({
  email: z.email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
    const { mutateAsync } = useForgotPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });


    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);

            await mutateAsync(data.email);

            setSubmittedEmail(data.email);
            setIsSubmitted(true);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <AuthPageShell title="We’ll help you return." description="Request a secure password reset link and continue where you left off.">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-primary hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to login</span>
          </Link>
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 justify-center w-full mb-6">
              <Logo />
              <span className="font-display text-2xl font-bold text-foreground">Hovuca.</span>
            </Link>
          </div>
        </div>

        {!isSubmitted ? (
          <>
            {/* Title and Description */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Reset your password</h1>
              <p className="mt-2 text-sm text-muted-foreground">Enter your email address and we&apos;ll send you a link to reset your password</p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-primary/20 bg-card backdrop-blur-md p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-coral hover:bg-brand-coral-dark text-foreground font-semibold   transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending reset link…" : "Send reset link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-primary transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to<br />
                <span className="font-medium text-foreground">{submittedEmail}</span>
              </p>
            </div>

            {/* Success Card */}
            <div className="rounded-2xl border border-primary/20 bg-card backdrop-blur-md p-8 shadow-2xl space-y-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>👉 Check your email (including spam folder) for the reset link</p>
                <p>👉 Click the link to create a new password</p>
                <p>👉 You&apos;ll be able to sign in with your new password</p>
              </div>

              <Button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-brand-coral hover:bg-brand-coral-dark text-foreground font-semibold   transition-all duration-300"
              >
                Didn&apos;t receive email? Try again
              </Button>

              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full border-primary/30 text-foreground hover:bg-muted"
                >
                  Return to login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthPageShell>
  );
}
