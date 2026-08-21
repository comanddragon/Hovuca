import { useState, useCallback } from "react";
import { useWebSocket, WsMessage } from "./useWebSocket";
import { useAuthStore } from "@/store/auth.store";

export interface LeaderboardEntry {
    rank: number;
    user: {
        id: string;
        full_name: string;
        avatar: string | null;
    };
    best_score: number;
    passed: boolean;
    attempts: number;
}

interface UseQuizSocketOptions {
    quizId: string;
    enabled?: boolean;
}

/**
 * useQuizSocket
 * =============
 * Connects to /ws/quiz/<quizId>/
 *
 * Returns:
 *   leaderboard      — top-10 entries, updated in real time after every submission
 *   secondsRemaining — live countdown (null if quiz has no timer)
 *   participants     — number of connected participants
 *   quizEnded        — true when the server signals quiz_ended
 *   requestLeaderboard — manually ask the server for a fresh leaderboard
 */
export function useQuizSocket({ quizId, enabled = true }: UseQuizSocketOptions) {
    const { isAuthenticated } = useAuthStore();
    const [leaderboard, setLeaderboard]           = useState<LeaderboardEntry[]>([]);
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const [participants, setParticipants]          = useState(0);
    const [quizEnded, setQuizEnded]                = useState(false);

    const handleMessage = useCallback((msg: WsMessage) => {
        switch (msg.type) {
            case "leaderboard":
                setLeaderboard(msg.entries as LeaderboardEntry[]);
                break;

            case "timer_tick":
                setSecondsRemaining(msg.seconds_remaining as number);
                break;

            case "participant_count":
                setParticipants(msg.count as number);
                break;

            case "quiz_ended":
                setQuizEnded(true);
                break;

            case "error":
                console.warn("[QuizSocket]", msg.message);
                break;
        }
    }, []);

    const { send } = useWebSocket({
        path: `ws/quiz/${quizId}/`,
        onMessage: handleMessage,
        enabled: isAuthenticated && enabled && !!quizId,
    });

    const requestLeaderboard = useCallback(
        () => send({ action: "request_leaderboard" }),
        [send]
    );

    return {
        leaderboard,
        secondsRemaining,
        participants,
        quizEnded,
        requestLeaderboard,
    };
}