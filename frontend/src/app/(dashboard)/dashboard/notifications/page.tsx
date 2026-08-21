"use client";

import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks";
import { SectionHeader, PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import { Bell, BookOpen, Heart, MessageSquare, Settings, Users } from "lucide-react";
import { NotificationType } from "@/types";

const typeIcon: Record<NotificationType, React.ElementType> = {
  system: Settings,
  course: BookOpen,
  quiz: BookOpen,
  donation: Heart,
  volunteer: Users,
  chat: MessageSquare,
};

const typeColor: Record<NotificationType, string> = {
  system: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  course: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  quiz: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  donation: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  volunteer: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  chat: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  if (isLoading) return <PageLoader />;

  const notifications = data?.results ?? [];
  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        description={`${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`}
        action={
          unread.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead()}
              disabled={markingAll}
            >
              {markingAll ? "Marking…" : "Mark all as read"}
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No notifications"
          description="You're all caught up! We'll notify you when something important happens."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcon[notif.notification_type] ?? Bell;
            const colorClass = typeColor[notif.notification_type] ?? "";
            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40",
                  notif.is_read
                    ? "border-border bg-card opacity-70"
                    : "border-primary/20 bg-primary/5"
                )}
              >
                {/* Icon */}
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", notif.is_read ? "text-muted-foreground" : "text-foreground")}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notif.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo(notif.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
