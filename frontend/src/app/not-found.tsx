"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MoveLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">404</p>
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">Page not found</h1>
            <p className="mb-8 max-w-sm text-muted-foreground">
                {`The page you're looking for doesn't exist or has been moved.`}
            </p>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>
                    <MoveLeft className="mr-2 h-4 w-4" /> Go back
                </Button>
                <Button asChild>
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" /> Home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
