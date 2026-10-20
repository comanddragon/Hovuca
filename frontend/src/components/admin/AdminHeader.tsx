"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";

export function AdminHeader() {
    const user = useAuthStore(state => state.user);
    const logout = useLogout();
    return <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <Link href="/admin" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-ring"><span className="text-2xl font-bold tracking-tight">HOVUCA</span><span className="border-l border-primary-foreground/30 pl-3 text-sm">Administration</span></Link>
            <div className="flex flex-wrap items-center gap-2"><span className="mr-2 hidden text-sm sm:block">{user?.full_name || user?.email}</span><Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link href="/" target="_blank" rel="noopener noreferrer"><ExternalLink />View website</Link></Button><Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link href="/dashboard/settings"><Settings /><span className="sr-only sm:not-sr-only">Account settings</span></Link></Button><Button variant="ghost" disabled={logout.isPending} className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => logout.mutate()}><LogOut />{logout.isPending ? "Signing out…" : "Sign out"}</Button></div>
        </div>
    </header>;
}
