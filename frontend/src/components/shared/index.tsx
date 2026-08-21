"use client";
import React from "react";
import { cn, statusColor } from "@/lib/utils";
import { Loader2 } from "lucide-react";
export * from "./pagination"
// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status?: string }) {
    if (!status) return null;

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusColor(status))}>
      {status.replace(/_/g, " ")}
    </span>
    );
}
// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-primary", className)} />;
}

// ─── Page Loading ─────────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

export function AvatarStack({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <div className="flex -space-x-2">
        {Array.from({ length: Math.min(3, count) }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-6 rounded-full border-2 border-background bg-muted"
            style={{ backgroundColor: `hsl(${i * 60 + 150} 50% 60%)` }}
          />
        ))}
      </div>
      <span>{count.toLocaleString()} {label}</span>
    </div>
  );
}
