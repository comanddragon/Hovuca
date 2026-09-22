"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/layout/Logo";
import { authPath, getBrowserReturnPath } from "@/lib/auth-return";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    login(data, {
      onSuccess: () => router.replace(getBrowserReturnPath()),
    });
  };

  return (
    <AuthPageShell title="Welcome back." description="Continue your work with children, young people, and communities across Cameroon.">
      <div>
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl font-bold text-primary">HOVUCA</span>
          </Link>
          <h2 className="mt-8 font-display text-4xl font-bold tracking-[-0.03em] text-foreground">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in to your account to continue.</p>
        </div>

        {/* Form card */}
        <div className="border-t border-primary/20 pt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-brand-coral-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
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
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-coral text-brand-white font-semibold hover:bg-brand-coral-dark"
              disabled={isPending}
            >
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              onClick={(event) => {
                event.preventDefault();
                router.push(authPath("/register", getBrowserReturnPath()));
              }}
              className="font-semibold text-primary hover:text-brand-coral-dark transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
