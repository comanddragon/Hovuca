"use client";

import { useEnrollments } from "@/hooks";
import { SectionHeader, PageLoader, EmptyState, StatusBadge, ProgressBar } from "@/components/shared/index";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { EnrollmentStatus } from "@/types";

const TABS: { label: string; value: EnrollmentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "enrolled" },
  { label: "Completed", value: "completed" },
  { label: "Dropped", value: "dropped" },
];

export default function MyCoursesPage() {
  const { data, isLoading } = useEnrollments();
  const [tab, setTab] = useState<EnrollmentStatus | "all">("all");

  if (isLoading) return <PageLoader />;

  const all = data?.results ?? [];
  const filtered = tab === "all" ? all : all.filter((e) => e.status === tab);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Courses"
        description="Track your learning progress across all enrolled courses."
        action={
          <Button asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({value === "all" ? all.length : all.filter((e) => e.status === value).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No courses here"
          description="Enroll in a course to start learning."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((enrollment) => (
            <div key={enrollment.id} className="rounded-xl border border-border bg-card p-5">
              {/* Thumbnail strip */}
              <div className="mb-4 h-32 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                {enrollment.course.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-foreground line-clamp-2">
                  {enrollment.course.title}
                </h3>
                <StatusBadge status={enrollment.status} />
              </div>

              <p className="mb-3 text-xs text-muted-foreground">
                Enrolled {formatDate(enrollment.enrolled_at)}
                {enrollment.completed_at && ` · Completed ${formatDate(enrollment.completed_at)}`}
              </p>

              {/* Progress */}
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-semibold text-foreground">{enrollment.progress_percentage}%</span>
                </div>
                <ProgressBar value={enrollment.progress_percentage} />
              </div>

              <div className="flex gap-2">
                {enrollment.status === "completed" ? (
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" disabled>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Completed
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/courses/${enrollment.course.slug}`}>
                      Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
