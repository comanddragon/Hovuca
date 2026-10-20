import { useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL;
const WS_ENABLED = process.env.NEXT_PUBLIC_WS_ENABLED === "true";

const HEARTBEAT_INTERVAL  = 30_000;
const RECONNECT_DELAY     =  3_000;
const MAX_RECONNECT_DELAY = 30_000;
const MAX_RETRIES         = 10;

export type WsMessage = Record<string, unknown> & { type: string };

export interface UseWebSocketOptions {
    path: string;
    onMessage: (msg: WsMessage) => void;
    enabled?: boolean;
    onOpen?: () => void;
    onClose?: (code: number) => void;
}

export interface UseWebSocketReturn {
    send: (payload: Record<string, unknown>) => void;
}

export function useWebSocket({
                                 path,
                                 onMessage,
                                 enabled = true,
                                 onOpen,
                                 onClose,
                             }: UseWebSocketOptions): UseWebSocketReturn {
    const wsRef        = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);
    const onOpenRef    = useRef(onOpen);
    const onCloseRef   = useRef(onClose);

    useEffect(() => { onMessageRef.current = onMessage; });
    useEffect(() => { onOpenRef.current    = onOpen; });
    useEffect(() => { onCloseRef.current   = onClose; });

    useEffect(() => {
        let mounted = true;
        let heartbeat: ReturnType<typeof setInterval> | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let retries = 0;
        let delay = RECONNECT_DELAY;

        const connect = async () => {
            if (!mounted) return;

            let ticket: string;
            try {
                const response = await api.post<{ ticket: string }>("/auth/ws-ticket/");
                ticket = response.data.ticket;
            } catch {
                console.warn("[useWebSocket] Could not obtain a connection ticket.");
                return;
            }
            if (!mounted) return;

            const url = `${WS_BASE}/${path}?ticket=${encodeURIComponent(ticket)}`;
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mounted) return;
                retries = 0;
                delay = RECONNECT_DELAY;
                heartbeat = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: "ping" }));
                    }
                }, HEARTBEAT_INTERVAL);
                onOpenRef.current?.();
            };

            ws.onmessage = (event) => {
                if (!mounted) return;
                try {
                    const msg = JSON.parse(event.data) as WsMessage;
                    if (msg.type === "pong") return;
                    onMessageRef.current(msg);
                } catch {
                    console.warn("[useWebSocket] Failed to parse message:", event.data);
                }
            };

            ws.onclose = ({ code }) => {
                if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
                onCloseRef.current?.(code);

                // 4001 = unauthorized, 4004 = not found — don't retry
                if (!mounted || code === 4001 || code === 4004) return;

                if (retries < MAX_RETRIES) {
                    retries++;
                    reconnectTimer = setTimeout(() => {
                        delay = Math.min(delay * 2, MAX_RECONNECT_DELAY);
                        void connect();
                    }, delay);
                }
            };

            ws.onerror = (e) => {
                console.warn("[useWebSocket] Socket error:", e);
                ws.close();
            };
        };

        if (enabled && WS_ENABLED && WS_BASE) void connect();

        return () => {
            mounted = false;
            if (heartbeat) clearInterval(heartbeat);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            wsRef.current?.close(1000);
            wsRef.current = null;
        };
    }, [enabled, path]);

    const send = useCallback((payload: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
        } else {
            console.warn("[useWebSocket] Cannot send — socket not open:", payload);
        }
    }, []);

    return { send };
}
