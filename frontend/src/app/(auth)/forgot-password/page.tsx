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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to login</span>
          </Link>
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 justify-center w-full mb-6">
              <Logo />
              <span className="font-display text-2xl font-bold text-white">Hovuca.</span>
            </Link>
          </div>
        </div>

        {!isSubmitted ? (
          <>
            {/* Title and Description */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 mb-4">
                <Mail className="h-6 w-6 text-purple-300" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Reset your password</h1>
              <p className="mt-2 text-sm text-purple-200/70">Enter your email address and we&apos;ll send you a link to reset your password</p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                    {...register("email")}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending reset link…" : "Send reset link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-purple-200/70">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-purple-300 hover:text-purple-200 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-400/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Check your email</h1>
              <p className="mt-3 text-sm text-purple-200/70">
                We&apos;ve sent a password reset link to<br />
                <span className="font-medium text-white">{submittedEmail}</span>
              </p>
            </div>

            {/* Success Card */}
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl space-y-6">
              <div className="space-y-3 text-sm text-purple-200/70">
                <p>👉 Check your email (including spam folder) for the reset link</p>
                <p>👉 Click the link to create a new password</p>
                <p>👉 You&apos;ll be able to sign in with your new password</p>
              </div>

              <Button
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Didn&apos;t receive email? Try again
              </Button>

              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full border-purple-400/30 text-white hover:bg-white/5"
                >
                  Return to login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
