"use client";

import { useMyDonations } from "@/hooks/index";
import { SectionHeader, PageLoader, EmptyState, StatusBadge } from "@/components/shared/index";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";

export default function MyDonationsPage() {
  const { data, isLoading } = useMyDonations();

  if (isLoading) return <PageLoader />;

  const donations = data?.results ?? [];
  const total = donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Donations"
        description="Your history of contributions."
        action={
          <Button asChild>
            <Link href="/donate">Donate again</Link>
          </Button>
        }
      />

      {/* Summary card */}
      {donations.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm text-muted-foreground">Total contributed</p>
          <p className="font-display text-3xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-sm text-muted-foreground">{donations.filter((d) => d.status === "completed").length} successful donations</p>
        </div>
      )}

      {donations.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="No donations yet"
          description="Support a campaign and create lasting impact."
          action={
            <Button asChild>
              <Link href="/donate">Browse campaigns <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {d.campaign ?? <span className="text-muted-foreground italic">General fund</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrency(d.amount, d.currency)}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{d.gateway}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    {d.receipt_sent ? (
                      <span className="text-xs text-green-600 font-medium">Sent</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
