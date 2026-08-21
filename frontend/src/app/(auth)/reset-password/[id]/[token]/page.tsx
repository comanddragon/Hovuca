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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center w-full mb-6">
            <Logo />
            <span className="font-display text-2xl font-bold text-white">Hovuca.</span>
          </Link>
        </div>

        {!isSuccess ? (
          <>
            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/30 mb-4">
                <KeyRound className="h-6 w-6 text-purple-300" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Set new password</h1>
              <p className="mt-2 text-sm text-purple-200/70">
                Your new password must be at least 8 characters long
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password_confirm" className="text-white">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="password_confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                      {...register("password_confirm")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password_confirm && (
                    <p className="text-xs text-red-400">{errors.password_confirm.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                  disabled={isPending}
                >
                  {isPending ? "Resetting password…" : "Reset password"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-purple-200/70">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-purple-300 hover:text-purple-200 transition-colors"
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-400/30 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Password reset!</h1>
              <p className="mt-2 text-sm text-purple-200/70">
                Your password has been updated successfully
              </p>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl space-y-4">
              <p className="text-sm text-purple-200/70 text-center">
                You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Go to login
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
