"use client";

import { useMyTasks } from "@/hooks";
import { SectionHeader, PageLoader, EmptyState, StatusBadge } from "@/components/shared";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { TaskStatus } from "@/types";

const TABS: { label: string; value: TaskStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function MyTasksPage() {
  const { data, isLoading } = useMyTasks();
  const [tab, setTab] = useState<TaskStatus | "all">("all");

  if (isLoading) return <PageLoader />;

  const all = data?.results ?? [];
  const filtered = tab === "all" ? all : all.filter((t) => t.status === tab);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="My Tasks"
        description="Volunteer tasks assigned to you."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
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
              ({value === "all" ? all.length : all.filter((t) => t.status === value).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="No tasks found"
          description="You have no tasks in this category."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div key={task.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-display font-semibold text-foreground">{task.title}</h3>
                <StatusBadge status={task.status} />
              </div>

              {task.description && (
                <p className="mb-3 text-sm text-muted-foreground">{task.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {task.project && (
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    📁 {typeof task.project === "string" ? task.project : task.project.title}
                  </span>
                )}
                {task.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {formatDate(task.due_date)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {task.hours_logged}h logged
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
