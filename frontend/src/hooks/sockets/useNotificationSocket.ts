import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWebSocket, WsMessage } from "./useWebSocket";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { keys } from "@/hooks";
import { Notification } from "@/types";

export function useNotificationSocket() {
    const { isAuthenticated } = useAuthStore();
    const qc = useQueryClient();
    const { setUnreadCount } = useNotificationStore();

    const handleMessage = useCallback(
        (msg: WsMessage) => {
            switch (msg.type) {
                case "unread_count": {
                    const count = msg.count as number;
                    setUnreadCount(count);
                    qc.setQueryData(keys.unreadCount, count);
                    break;
                }
                case "notification": {
                    const notification = msg.data as Notification;

                    // Access store imperatively to avoid stale closures
                    const { pushNotification, incrementUnread } =
                        useNotificationStore.getState();

                    pushNotification(notification);
                    incrementUnread();

                    qc.invalidateQueries({ queryKey: keys.notifications });

                    toast(notification.title ?? "New notification", {
                        description: notification.body,
                        action: notification.action_url
                            ? {
                                label: "View",
                                onClick: () =>
                                    window.location.assign(notification.action_url),
                            }
                            : undefined,
                    });

                    break;
                }
                case "error":
                    console.warn("[NotificationSocket]", msg.message);
                    break;
            }
        },
        [qc, setUnreadCount] // ✅ pushNotification removed — read from getState() instead
    );

    const { send } = useWebSocket({
        path: "ws/notifications/",
        onMessage: handleMessage,
        enabled: isAuthenticated,
    });

    const markRead = useCallback(
        (notificationId: string) =>
            send({ action: "mark_read", notification_id: notificationId }),
        [send]
    );

    const markAllRead = useCallback(
        () => send({ action: "mark_all_read" }),
        [send]
    );

    return { markRead, markAllRead };
}