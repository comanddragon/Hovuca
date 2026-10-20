/**
 * quiz.store.ts
 * =============
 * Client state for an active quiz session.
 *
 * What lives here:
 *   - The user's in-progress answers (keyed by questionId → choiceId)
 *   - Which question is currently visible
 *   - Local timer display (synced from socket timer_tick events)
 *   - Whether the leaderboard panel is open
 *   - Session result after submission
 *
 * What does NOT live here:
 *   - Quiz data / questions (fetched via useQuiz TanStack Query hook)
 *   - Leaderboard entries (owned by useQuizSocket)
 *   - Submission mutation (handled by useSubmitQuiz hook)
 */

import { create } from "zustand";
import { QuizAttempt } from "@/types";

interface QuizSessionState {
    // ── Current quiz ───────────────────────────────────────────────────
    activeQuizId: string | null;
    setActiveQuiz: (id: string | null) => void;

    // ── Answer tracking ────────────────────────────────────────────────
    /** Map of questionId → selected choiceId */
    answers: Record<string, string>;
    selectAnswer: (questionId: string, choiceId: string) => void;
    clearAnswers: () => void;

    // ── Navigation ─────────────────────────────────────────────────────
    currentQuestionIndex: number;
    goToQuestion: (index: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;

    // ── Timer ──────────────────────────────────────────────────────────
    /** Seconds remaining — written by useQuizSocket on timer_tick */
    secondsRemaining: number | null;
    setSecondsRemaining: (seconds: number | null) => void;

    // ── Session result ─────────────────────────────────────────────────
    result: QuizAttempt | null;
    setResult: (attempt: QuizAttempt) => void;

    // ── UI ─────────────────────────────────────────────────────────────
    isLeaderboardOpen: boolean;
    openLeaderboard:  () => void;
    closeLeaderboard: () => void;
    toggleLeaderboard: () => void;
    isSubmitting: boolean;
    setSubmitting: (v: boolean) => void;

    // ── Reset ──────────────────────────────────────────────────────────
    /** Call when leaving the quiz page to avoid stale state */
    resetSession: () => void;
}

export const useQuizStore = create<QuizSessionState>()((set) => ({
    // ── Current quiz ───────────────────────────────────────────────────
    activeQuizId: null,
    setActiveQuiz: (id) => set({ activeQuizId: id }),

    // ── Answers ────────────────────────────────────────────────────────
    answers: {},
    selectAnswer: (questionId, choiceId) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: choiceId } })),
    clearAnswers: () => set({ answers: {} }),

    // ── Navigation ─────────────────────────────────────────────────────
    currentQuestionIndex: 0,
    goToQuestion: (index) => set({ currentQuestionIndex: index }),
    nextQuestion: () =>
        set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
    prevQuestion: () =>
        set((s) => ({
            currentQuestionIndex: Math.max(0, s.currentQuestionIndex - 1),
        })),

    // ── Timer ──────────────────────────────────────────────────────────
    secondsRemaining: null,
    setSecondsRemaining: (seconds) => set({ secondsRemaining: seconds }),

    // ── Result ─────────────────────────────────────────────────────────
    result: null,
    setResult: (attempt) => set({ result: attempt }),

    // ── UI ─────────────────────────────────────────────────────────────
    isLeaderboardOpen: false,
    openLeaderboard:   () => set({ isLeaderboardOpen: true }),
    closeLeaderboard:  () => set({ isLeaderboardOpen: false }),
    toggleLeaderboard: () => set((s) => ({ isLeaderboardOpen: !s.isLeaderboardOpen })),
    isSubmitting: false,
    setSubmitting: (v) => set({ isSubmitting: v }),

    // ── Reset ──────────────────────────────────────────────────────────
    resetSession: () =>
        set({
            activeQuizId: null,
            answers: {},
            currentQuestionIndex: 0,
            secondsRemaining: null,
            result: null,
            isLeaderboardOpen: false,
            isSubmitting: false,
        }),
}));
