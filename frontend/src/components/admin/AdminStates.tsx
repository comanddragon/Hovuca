"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminErrors } from "@/services/admin.service";

export function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
    return <div role="alert" className="border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 font-semibold text-foreground"><AlertCircle className="size-5 text-destructive" />Unable to load this section</div>
        <p className="my-3 text-sm text-muted-foreground">{Object.values(adminErrors(error)).join(" ")}</p>
        <Button variant="outline" onClick={retry}><RefreshCw />Try again</Button>
    </div>;
}

export function AdminSkeleton() {
    return <div role="status" aria-label="Loading admin workspace" className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted" /><div className="h-10 bg-muted" />
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-14 border-b border-border bg-muted/40" />)}
        <span className="sr-only">Loading…</span>
    </div>;
}
