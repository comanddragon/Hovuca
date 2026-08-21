"use client";

import { useVolunteerMe, useMyTasks } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { SectionHeader, StatusBadge, PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Award, Calendar, CheckCircle2, ClipboardList,
  Clock, Users, Zap, ArrowRight,
} from "lucide-react";

export default function VolunteerDashboardPage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useVolunteerMe();
  const { data: tasksData } = useMyTasks();

  if (profileLoading) return <PageLoader />;

  // Not a volunteer
  if (!profile && user?.role !== "volunteer") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Volunteer Hub" />
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="You're not a volunteer yet"
          description="Switch your role or contact an admin to join as a volunteer."
        />
      </div>
    );
  }

  const tasks = tasksData?.results ?? [];
  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const completed = tasks.filter((t) => t.status === "completed");
  const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.hours_logged), 0);

  const stats = [
    { label: "Pending tasks", value: pending.length, icon: ClipboardList, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    { label: "In progress", value: inProgress.length, icon: Zap, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Hours logged", value: `${(profile?.hours_contributed ?? totalHours).toFixed(0)}h`, icon: Clock, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Volunteer Hub"
        description="Your volunteer activity, skills, and task board."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/tasks">All tasks <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile card */}
        {profile && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Volunteer Profile</h2>
              <StatusBadge status={profile.availability} />
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}

            <Separator />

            {/* Skills */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Department */}
            {profile.department && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department</p>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {profile.department.name}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              Member since {formatDate(profile.created_at)}
            </div>
          </div>
        )}

        {/* Recent tasks */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Recent Tasks</h2>
            <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" />}
              title="No tasks assigned"
              description="Tasks assigned by your team will appear here."
            />
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.hours_logged}h
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
