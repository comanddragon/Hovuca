"use client";
import { useEffect } from "react";
import { useNotificationSocket } from "@/hooks/sockets/useNotificationSocket";
import { useUnreadCount } from "@/hooks";
import { useNotificationStore } from "@/store/notification.store";

export function NotificationProvider() {
    const { data: initialCount } = useUnreadCount();
    const setUnreadCount = useNotificationStore(s => s.setUnreadCount);

    useEffect(() => {
        if (initialCount !== undefined) setUnreadCount(initialCount);
    }, [initialCount, setUnreadCount]);

    useNotificationSocket();

    return null;
}