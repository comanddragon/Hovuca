"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, KeyRound } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { toast } from "sonner";
import { useResetPassword } from "@/hooks";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;
  const token = params.token as string;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutateAsync, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync({ uid, token, password: data.password });
      setIsSuccess(true);
    } catch {
      toast.error("This reset link is invalid or has expired. Please request a new one.");
    }
  };

  return (
    <AuthPageShell title="Set a secure new password." description="Choose a password you’ll remember, then get back to your HOVUCA account.">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center w-full mb-6">
            <Logo />
            <span className="font-display text-2xl font-bold text-foreground">Hovuca.</span>
          </Link>
        </div>

        {!isSuccess ? (
          <>
            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/30 mb-4">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Set new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your new password must be at least 8 characters long
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-primary/20 bg-card backdrop-blur-md p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-foreground">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password_confirm" className="text-foreground">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="password_confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                      {...register("password_confirm")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password_confirm && (
                    <p className="text-xs text-destructive">{errors.password_confirm.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-coral hover:bg-brand-coral-dark text-foreground font-semibold   transition-all duration-300"
                  disabled={isPending}
                >
                  {isPending ? "Resetting password…" : "Reset password"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Password reset!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been updated successfully
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-card backdrop-blur-md p-8 shadow-2xl space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-brand-coral hover:bg-brand-coral-dark text-foreground font-semibold   transition-all duration-300"
              >
                Go to login
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthPageShell>
  );
}
