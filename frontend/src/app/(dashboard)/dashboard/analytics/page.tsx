"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SectionHeader, PageLoader } from "@/components/shared";
import { formatCurrency } from "@/lib/utils";
import {
  BookOpen, DollarSign, Heart, Target,
  TrendingUp, Users, Zap, Award,
} from "lucide-react";

// Derive analytics from existing endpoints
// Derive analytics from existing endpoints
function useAnalytics() {
    const users = useQuery({ queryKey: ["analytics-users"], queryFn: () => api.get("/users/?page_size=1").then((r) => r.data.count ?? 0) });
    const programs = useQuery({ queryKey: ["analytics-programs"], queryFn: () => api.get("/programs/?page_size=1").then((r) => r.data.count ?? 0) });
    const courses = useQuery({ queryKey: ["analytics-courses"], queryFn: () => api.get("/courses/?page_size=1").then((r) => r.data.count ?? 0) });
    const campaigns = useQuery({ queryKey: ["analytics-campaigns"], queryFn: () => api.get("/campaigns/?page_size=100").then((r) => r.data) });
    const enrollments = useQuery({ queryKey: ["analytics-enrollments"], queryFn: () => api.get("/enrollments/?page_size=1").then((r) => r.data.count ?? 0) });
    const volunteers = useQuery({ queryKey: ["analytics-volunteers"], queryFn: () => api.get("/users/?role=volunteer&page_size=1").then((r) => r.data.count ?? 0) });

    const totalRaised = campaigns.data?.results?.reduce(
        (sum: number, c: { raised_amount: string }) => sum + parseFloat(c.raised_amount), 0
    ) ?? 0;

    const activeCampaigns = campaigns.data?.results?.filter(
        (c: { status: string }) => c.status === "active"
    ).length ?? 0;

    return {
            users: users.data ?? 0,
            programs: programs.data ?? 0,
            courses: courses.data ?? 0,
            totalRaised,
            activeCampaigns,
            enrollments: enrollments.data ?? 0,
            volunteers: volunteers.data ?? 0,
            campaignResults: campaigns.data?.results ?? [],
            isLoading: users.isLoading || programs.isLoading || courses.isLoading,
};
}

const cards = (data: ReturnType<typeof useAnalytics>) => [
  { label: "Total Users", value: data.users.toLocaleString(), icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", trend: "+12% this month" },
  { label: "Active Programs", value: data.programs.toLocaleString(), icon: Target, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", trend: "Across all orgs" },
  { label: "Total Courses", value: data.courses.toLocaleString(), icon: BookOpen, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", trend: "Published courses" },
  { label: "Total Enrolled", value: data.enrollments.toLocaleString(), icon: Award, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", trend: "All-time enrollments" },
  { label: "Funds Raised", value: formatCurrency(data.totalRaised), icon: Heart, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", trend: `${data.activeCampaigns} active campaigns` },
  { label: "Volunteers", value: data.volunteers.toLocaleString(), icon: Zap, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", trend: "Registered volunteers" },
];

export default function AnalyticsPage() {
  const data = useAnalytics();

  if (data.isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics Overview"
        description="Live platform-wide metrics."
      />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards(data).map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{value}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {trend}
            </div>
          </div>
        ))}
      </div>

      {/* Donation breakdown */}
      {/*<div className="rounded-xl border border-border bg-card p-6">*/}
      {/*  <h2 className="mb-5 font-display text-lg font-bold text-foreground flex items-center gap-2">*/}
      {/*    <DollarSign className="h-5 w-5" /> Campaign Performance*/}
      {/*  </h2>*/}
      {/*  <div className="overflow-x-auto">*/}
      {/*    <table className="w-full text-sm">*/}
      {/*      <thead>*/}
      {/*        <tr className="border-b border-border text-left text-xs text-muted-foreground">*/}
      {/*          <th className="pb-2 pr-4 font-medium">Campaign</th>*/}
      {/*          <th className="pb-2 pr-4 font-medium">Goal</th>*/}
      {/*          <th className="pb-2 pr-4 font-medium">Raised</th>*/}
      {/*          <th className="pb-2 font-medium">Progress</th>*/}
      {/*        </tr>*/}
      {/*      </thead>*/}
      {/*      <tbody className="divide-y divide-border">*/}
      {/*        {(useQuery({ queryKey: ["analytics-campaigns"], queryFn: () => api.get("/campaigns/?page_size=10").then((r) => r.data) }).data?.results ?? []).map(*/}
      {/*          (c: { id: string; title: string; goal_amount: string; raised_amount: string; progress_percentage: number; status: string }) => (*/}
      {/*            <tr key={c.id}>*/}
      {/*              <td className="py-2 pr-4 font-medium text-foreground">{c.title}</td>*/}
      {/*              <td className="py-2 pr-4 text-muted-foreground">{formatCurrency(c.goal_amount)}</td>*/}
      {/*              <td className="py-2 pr-4 font-semibold text-foreground">{formatCurrency(c.raised_amount)}</td>*/}
      {/*              <td className="py-2">*/}
      {/*                <div className="flex items-center gap-2">*/}
      {/*                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">*/}
      {/*                    <div*/}
      {/*                      className="h-full rounded-full bg-primary transition-all"*/}
      {/*                      style={{ width: `${Math.min(100, c.progress_percentage)}%` }}*/}
      {/*                    />*/}
      {/*                  </div>*/}
      {/*                  <span className="w-10 text-right text-xs text-muted-foreground">*/}
      {/*                    {c.progress_percentage.toFixed(0)}%*/}
      {/*                  </span>*/}
      {/*                </div>*/}
      {/*              </td>*/}
      {/*            </tr>*/}
      {/*          )*/}
      {/*        )}*/}
      {/*      </tbody>*/}
      {/*    </table>*/}
      {/*  </div>*/}
      {/*</div>*/}

        <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-5 font-display text-lg font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Campaign Performance
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Campaign</th>
                        <th className="pb-2 pr-4 font-medium">Goal</th>
                        <th className="pb-2 pr-4 font-medium">Raised</th>
                        <th className="pb-2 font-medium">Progress</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                                     {data.campaignResults.map(
                                (c: { id: string; title: string; goal_amount: string; raised_amount: string; progress_percentage: number; status: string }) => (
                                    <tr key={c.id}>
                                        <td className="py-2 pr-4 font-medium text-foreground">{c.title}</td>
                                        <td className="py-2 pr-4 text-muted-foreground">{formatCurrency(c.goal_amount)}</td>
                                        <td className="py-2 pr-4 font-semibold text-foreground">{formatCurrency(c.raised_amount)}</td>
                                        <td className="py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${Math.min(100, c.progress_percentage)}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-xs text-muted-foreground">
                          {c.progress_percentage.toFixed(0)}%
                        </span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                        </table>
                        </div>
                        </div>
    </div>
  );
}
