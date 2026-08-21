import { useState, useCallback, useRef } from "react";
import { useWebSocket, WsMessage } from "./useWebSocket";
import { useAuthStore } from "@/store/auth.store";

export interface ChatUser {
    id: string;
    full_name: string;
    avatar: string | null;
}

export interface ChatMessage {
    id: string | null;
    room_id: string;
    sender: ChatUser;
    content: string;
    timestamp: string;
}

export interface TypingState {
    user: ChatUser;
    is_typing: boolean;
}

interface UseChatSocketOptions {
    roomId: string;
    /** Only connect when true — pass false until the room is ready */
    enabled?: boolean;
}

/**
 * useChatSocket
 * =============
 * Connects to /ws/chat/<roomId>/
 *
 * Returns:
 *   messages     — full message history (seeded from server on connect, appended live)
 *   typingUsers  — set of users currently typing (auto-cleared after 3 s of inactivity)
 *   participants — live participant count
 *   sendMessage  — send a chat message
 *   sendTyping   — send typing indicator (true = started, false = stopped)
 *   isConnected  — true once the socket opens
 */
export function useChatSocket({ roomId, enabled = true }: UseChatSocketOptions) {
    const { isAuthenticated } = useAuthStore();
    const [messages, setMessages]       = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, ChatUser>>(new Map());
    const [participants, setParticipants] = useState(0);
    const [isConnected, setIsConnected]   = useState(false);

    // Auto-clear typing indicators after 3 s of silence
    const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const clearTyping = useCallback((userId: string) => {
        setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
        });
        const t = typingTimers.current.get(userId);
        if (t) { clearTimeout(t); typingTimers.current.delete(userId); }
    }, []);

    const handleMessage = useCallback(
        (msg: WsMessage) => {
            switch (msg.type) {
                case "history":
                    setMessages(msg.messages as ChatMessage[]);
                    break;

                case "chat_message":
                    setMessages((prev) => [...prev, msg.message as ChatMessage]);
                    break;

                case "user_joined":
                    setParticipants((p) => p + 1);
                    break;

                case "user_left":
                    setParticipants((p) => Math.max(0, p - 1));
                    break;

                case "typing": {
                    const { user, is_typing } = msg as WsMessage & {
                        user: ChatUser;
                        is_typing: boolean;
                    };
                    if (is_typing) {
                        setTypingUsers((prev) => new Map(prev).set(user.id, user));
                        // Reset the auto-clear timer
                        const existing = typingTimers.current.get(user.id);
                        if (existing) clearTimeout(existing);
                        typingTimers.current.set(
                            user.id,
                            setTimeout(() => clearTyping(user.id), 3_000)
                        );
                    } else {
                        clearTyping(user.id);
                    }
                    break;
                }

                case "participant_count":
                    setParticipants(msg.count as number);
                    break;

                case "error":
                    console.warn("[ChatSocket]", msg.message);
                    break;
            }
        },
        [clearTyping]
    );

    const { send } = useWebSocket({
        path: `ws/chat/${roomId}/`,
        onMessage: handleMessage,
        enabled: isAuthenticated && enabled && !!roomId,
        onOpen:  () => setIsConnected(true),
        onClose: () => setIsConnected(false),
    });

    const sendMessage = useCallback(
        (content: string) => send({ action: "send_message", content }),
        [send]
    );

    const sendTyping = useCallback(
        (isTyping: boolean) => send({ action: "typing", is_typing: isTyping }),
        [send]
    );

    return {
        messages,
        typingUsers: Array.from(typingUsers.values()),
        participants,
        isConnected,
        sendMessage,
        sendTyping,
    };
}