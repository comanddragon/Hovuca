import Link from "next/link";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import type { ReactNode } from "react";
import Logo from "@/components/layout/Logo";

type AuthPageShellProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export function AuthPageShell({ children, title, description }: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(22rem,0.82fr)_minmax(0,1.18fr)]">
      <aside className="relative hidden overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:px-16">
        <Link href="/" className="inline-flex w-fit items-center gap-3" aria-label="HOVUCA home">
          <Logo />
          <span className="font-display text-2xl font-bold tracking-[-0.03em]">HOVUCA</span>
        </Link>
        <div className="max-w-md">
          <HeartHandshake aria-hidden="true" className="mb-8 size-9 text-brand-gold-light" />
          <h1 className="font-display text-5xl font-bold leading-[0.96] tracking-[-0.04em] text-balance">{title}</h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-primary-foreground/80">{description}</p>
        </div>
        <Link href="/about" className="inline-flex w-fit items-center gap-3 text-sm font-semibold text-primary-foreground transition-colors hover:text-brand-gold-light">
          Discover HOVUCA <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </aside>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 inline-flex items-center gap-3 lg:hidden" aria-label="HOVUCA home">
            <Logo />
            <span className="font-display text-2xl font-bold tracking-[-0.03em] text-primary">HOVUCA</span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
