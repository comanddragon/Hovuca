"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRegister } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/layout/Logo";
import { authPath, getBrowserReturnPath } from "@/lib/auth-return";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const schema = z.object({
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
    date_of_birth: z.string().optional(),
    email: z.email("Enter a valid email"),
    phone_number: z.string().optional(),
    role: z.enum(["volunteer", "student", "donor"]),  // ← remove .default()
    password: z.string().min(8, "At least 8 characters"),
    password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
});

type FormData = z.infer<typeof schema>;

const roles = [
  { value: "student", label: "Student" },
  { value: "volunteer", label: "Volunteer" },
  { value: "donor", label: "Donor" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

    const { register: rhf, handleSubmit, formState: { errors }, setValue, control } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: "student" },
    });

    const selectedRole = useWatch({ control, name: "role" });

    useEffect(() => {
        const requestedRole = new URLSearchParams(window.location.search).get("role");
        if (requestedRole === "volunteer" || requestedRole === "student" || requestedRole === "donor") {
            setValue("role", requestedRole);
        }
    }, [setValue]);

  const onSubmit = (data: FormData) => {
    register(data, {
      onSuccess: () => router.replace(getBrowserReturnPath()),
    });
  };

  return (
    <AuthPageShell title="A place to begin." description="Create an account to learn, volunteer, and support practical opportunity with HOVUCA.">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo/>
            <span className="font-display text-2xl font-bold text-foreground">Hovuca.</span>
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join our community and start making impact</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-card backdrop-blur-md p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-foreground">I am joining as</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("role", value as FormData["role"])}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedRole === value
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-foreground">First name</Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                  {...rhf("first_name")}
                />
                {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-foreground">Last name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                  {...rhf("last_name")}
                />
                {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                {...rhf("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth" className="text-foreground">Birthday <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="date_of_birth"
                type="date"
                autoComplete="bday"
                max={new Date().toISOString().slice(0, 10)}
                className="bg-card border-primary/30 text-foreground focus:border-primary/60 focus:ring-primary/20"
                {...rhf("date_of_birth")}
              />
              {errors.date_of_birth && <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-foreground">Phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1 555 000 0000"
                className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                {...rhf("phone_number")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                {...rhf("password")}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirm" className="text-foreground">Confirm password</Label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="Repeat password"
                className="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-primary/20"
                {...rhf("password_confirm")}
              />
              {errors.password_confirm && <p className="text-xs text-destructive">{errors.password_confirm.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-coral hover:bg-brand-coral-dark text-foreground font-semibold   transition-all duration-300"
              disabled={isPending}
            >
              {isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              onClick={(event) => {
                event.preventDefault();
                router.push(authPath("/login", getBrowserReturnPath()));
              }}
              className="font-medium text-primary hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}
