"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/layout/Logo";

const schema = z.object({
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
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

  const onSubmit = (data: FormData) => {
    register(data, {
      onSuccess: () => router.push("/dashboard"),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo/>
            <span className="font-display text-2xl font-bold text-white">Hovuca.</span>
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-purple-200/70">Join our community and start making impact</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 backdrop-blur-md p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-white">I am joining as</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("role", value as FormData["role"])}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedRole === value
                        ? "border-purple-400/60 bg-purple-500/20 text-purple-200"
                        : "border-purple-400/20 text-white/60 hover:border-purple-400/40 hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-white">First name</Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                  {...rhf("first_name")}
                />
                {errors.first_name && <p className="text-xs text-red-400">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-white">Last name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                  {...rhf("last_name")}
                />
                {errors.last_name && <p className="text-xs text-red-400">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                {...rhf("email")}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-white">Phone <span className="text-white/50">(optional)</span></Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+1 555 000 0000"
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                {...rhf("phone_number")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                {...rhf("password")}
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password_confirm" className="text-white">Confirm password</Label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="Repeat password"
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/40 focus:border-purple-400/60 focus:ring-purple-500/50"
                {...rhf("password_confirm")}
              />
              {errors.password_confirm && <p className="text-xs text-red-400">{errors.password_confirm.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              disabled={isPending}
            >
              {isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-purple-200/70">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-purple-300 hover:text-purple-200 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
