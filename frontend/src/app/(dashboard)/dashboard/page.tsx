"use client";

import { useMe, useEnrollments, useMyDonations, useNotifications, useMyTasks } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { SectionHeader, StatusBadge, ProgressBar, PageLoader } from "@/components/shared";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import Link from "next/link";
import {
  Bell, BookOpen, ClipboardList, Heart,
  ArrowRight, CheckCircle2, AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: profile } = useMe();
  const { data: enrollments } = useEnrollments();
  const { data: donations } = useMyDonations();
  const { data: notifications } = useNotifications();
  const { data: tasks } = useMyTasks();

  if (!user) return <PageLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeEnrollments = enrollments?.results?.filter(e => e.status === "enrolled") ?? [];
  const completedCourses = enrollments?.results?.filter(e => e.status === "completed") ?? [];
  const unreadNotifications = notifications?.results?.filter(n => !n.is_read) ?? [];
  const pendingTasks = tasks?.results?.filter(t => t.status === "pending") ?? [];
  const totalDonated = donations?.results?.reduce((sum, d) => sum + parseFloat(d.amount), 0) ?? 0;

  const stats = [
    { label: "Enrolled Courses", value: activeEnrollments.length, icon: BookOpen, href: "/dashboard/courses", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Completed Courses", value: completedCourses.length, icon: CheckCircle2, href: "/dashboard/courses", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Total Donated", value: formatCurrency(totalDonated), icon: Heart, href: "/dashboard/donations", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    { label: "Pending Tasks", value: pendingTasks.length, icon: ClipboardList, href: "/dashboard/tasks", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`${greeting}, ${user.first_name}! 👋`}
        description="Here's a summary of your activity."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href} className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* In-progress courses */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">In Progress</h2>
            <Link href="/dashboard/courses" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No courses in progress. <Link href="/courses" className="text-primary hover:underline">Browse courses →</Link></p>
          ) : (
            <div className="space-y-3">
              {activeEnrollments.slice(0, 4).map((enrollment) => (
                <Link key={enrollment.id} href={`/courses/${enrollment.course.slug}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{enrollment.course.title}</p>
                    <ProgressBar value={enrollment.progress_percentage} className="mt-1.5 h-1.5" />
                    <p className="mt-0.5 text-xs text-muted-foreground">{enrollment.progress_percentage}% complete</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications.length > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </h2>
            <Link href="/dashboard/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {unreadNotifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{`You're all caught up!🎉`}</p>
          ) : (
            <div className="space-y-2">
              {unreadNotifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notif.body}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(notif.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent donations */}
      {donations && donations.results.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Donations</h2>
            <Link href="/dashboard/donations" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Campaign</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.results.slice(0, 5).map((d) => (
                  <tr key={d.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 text-foreground">{d.campaign ?? "General"}</td>
                    <td className="py-2 font-semibold text-foreground">{formatCurrency(d.amount, d.currency)}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(d.created_at)}</td>
                      <td className="py-2">
                          {d.status ? <StatusBadge status={d.status} /> : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
