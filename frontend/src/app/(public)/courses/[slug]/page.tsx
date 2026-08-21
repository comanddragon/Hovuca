"use client";

import { useParams, useRouter } from "next/navigation";
import { useCourse, useCourseModules, useEnrollments, useEnroll, useMarkChapterComplete } from "@/hooks/index";
import { PageLoader, StatusBadge, ProgressBar, AvatarStack } from "@/components/shared/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  Clock, FileText, Lock, Play, Users, Video,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const contentIcon = {
  video: Play,
  text: FileText,
  pdf: FileText,
};

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: modules = [], isLoading: modulesLoading } = useCourseModules(course?.id ?? "");
  const { data: enrollments } = useEnrollments();
  const { mutate: enroll, isPending: enrolling } = useEnroll();
  const { mutate: markComplete } = useMarkChapterComplete();

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  if (courseLoading || modulesLoading) return <PageLoader />;
  if (!course) return <div className="p-8 text-center text-muted-foreground">Course not found.</div>;

  const enrollment = enrollments?.results?.find((e) => e.course.id === course.id);
  const isEnrolled = !!enrollment;

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const levelColor: Record<string, string> = {
    beginner: "text-green-600 bg-green-50 dark:bg-green-900/20",
    intermediate: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    advanced: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — course info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${levelColor[course.level] ?? ""}`}>
                {course.level}
              </span>
              {course.is_free && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">Free</span>
              )}
              {course.subject && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {course.subject.name}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{course.title}</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">{course.description}</p>
          </div>

          {/* Instructor + meta */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-4">
            {course.instructor && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarUrl(course.instructor.avatar) ?? undefined} />
                  <AvatarFallback>{getInitials(course.instructor.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{course.instructor.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{course.instructor.role}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />{course.duration_hours}h total
            </div>
            <AvatarStack count={course.enrollment_count} label="enrolled" />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />{modules.length} modules
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {isEnrolled && enrollment && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Your Progress</p>
                <p className="text-sm font-bold text-primary">{enrollment.progress_percentage}%</p>
              </div>
              <ProgressBar value={enrollment.progress_percentage} />
              {enrollment.status === "completed" && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Course completed!
                </p>
              )}
            </div>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">Curriculum</h2>
            <div className="space-y-2">
              {modules.map((mod, idx) => {
                const isOpen = openModules.has(mod.id);
                return (
                  <div key={mod.id} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between bg-muted/40 px-4 py-3 text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{mod.title}</p>
                          {mod.description && (
                            <p className="text-xs text-muted-foreground">{mod.description}</p>
                          )}
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {isOpen && mod.chapters && (
                      <div className="divide-y divide-border">
                        {mod.chapters.map((chapter) => {
                          const Icon = contentIcon[chapter.content_type] ?? FileText;
                          const locked = !isEnrolled && !chapter.is_free_preview;
                          return (
                            <div
                              key={chapter.id}
                              className={`flex items-center gap-3 px-4 py-3 ${locked ? "opacity-50" : "hover:bg-muted/30 cursor-pointer"}`}
                              onClick={() => {
                                if (!locked) markComplete(chapter.id);
                              }}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card border border-border">
                                {locked ? (
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">{chapter.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {chapter.content_type} · {chapter.duration_minutes}min
                                </p>
                              </div>
                              {chapter.is_free_preview && (
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                  Preview
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — sticky enroll card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.thumbnail} alt={course.title} className="w-full object-cover h-40" />
              </div>
            )}

            <div className="space-y-1">
              <p className="font-display text-2xl font-bold text-foreground">
                {course.is_free ? "Free" : "Paid"}
              </p>
              <p className="text-sm text-muted-foreground">Full lifetime access</p>
            </div>

            {isEnrolled ? (
              <div className="space-y-2">
                <Button className="w-full" variant="outline" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Enrolled
                </Button>
                <Button className="w-full" asChild>
                  <Link href={`/courses/${slug}/learn`}>Continue learning →</Link>
                </Button>
              </div>
            ) : isAuthenticated ? (
              <Button
                className="w-full"
                onClick={() => enroll(course.id)}
                disabled={enrolling}
              >
                {enrolling ? "Enrolling…" : "Enroll now — it's free"}
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <Link href="/src/app/login">Sign in to enroll</Link>
              </Button>
            )}

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Clock className="h-4 w-4" />{course.duration_hours} hours of content</li>
              <li className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{modules.length} modules</li>
              <li className="flex items-center gap-2"><Users className="h-4 w-4" />{course.enrollment_count} students enrolled</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
