"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuiz, useSubmitQuiz } from "@/hooks";
import { useQuizSocket } from "@/hooks/sockets/useQuizSocket";
import { useQuizStore } from "@/store";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, ChevronLeft, ChevronRight, Users, Trophy } from "lucide-react";

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const { data: quiz, isLoading } = useQuiz(quizId);
  const { mutate: submitQuiz, isPending: submitting, data: apiResult } = useSubmitQuiz(quizId);

  // Store for persistent state across re-renders
  const {
    answers,
    selectAnswer,
    currentQuestionIndex,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    setSecondsRemaining,
    result: storeResult,
    setResult,
    isLeaderboardOpen,
    toggleLeaderboard,
  } = useQuizStore();

  // Socket for real-time leaderboard and timer
    const { leaderboard, secondsRemaining, participants } = useQuizSocket({
        quizId,
        enabled: !!quizId,
    });

  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync socket seconds with local display
  useEffect(() => {
    if (secondsRemaining !== null) {
      setTimeLeft(secondsRemaining);
      setSecondsRemaining(secondsRemaining);
    } else if (quiz?.time_limit_minutes && !submitted) {
      // Fallback: use local countdown if no socket timer
      if (timeLeft === null) {
        setTimeLeft(quiz.time_limit_minutes * 60);
      }
    }
  }, [secondsRemaining, quiz, submitted, timeLeft, setSecondsRemaining]);

  // Local countdown (fallback when socket timer is unavailable)
  useEffect(() => {
    if (secondsRemaining !== null || timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const id = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  // Sync with API result
    useEffect(() => {
        if (apiResult) {
            setResult(apiResult);
            if (apiTimeoutRef.current) {
                clearTimeout(apiTimeoutRef.current);
            }
        }
    }, [apiResult, setResult]);

    useEffect(() => {
        const timeout = apiTimeoutRef.current;
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, []);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const payload = Object.entries(answers).map(([question, choice]) => ({ question, choice }));
    submitQuiz(payload);
  }, [submitted, answers, submitQuiz]);

  if (isLoading) return <PageLoader />;
  if (!quiz) return <div className="p-8 text-center text-muted-foreground">Quiz not found.</div>;

  const questions = quiz.questions ?? [];
  const question = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allAnswered = questions.every((q) => answers[q.id]);
  const result = storeResult || apiResult;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Results screen ──────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className={cn(
          "mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full",
          result.passed ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
        )}>
          {result.passed
            ? <CheckCircle2 className="h-10 w-10" />
            : <XCircle className="h-10 w-10" />}
        </div>

        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
          {result.passed ? "Congratulations! 🎉" : "Keep practising!"}
        </h1>
        <p className="mb-8 text-muted-foreground">
          You scored <span className="font-bold text-foreground">{result.percentage.toFixed(0)}%</span>{" "}
          ({result.score}/{result.max_score} points)
        </p>

        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className={cn("h-3 w-full", result.passed ? "bg-green-500" : "bg-red-500")}
            style={{ width: `${result.percentage}%` }} />
          <div className="grid grid-cols-2 divide-x divide-border p-6 text-center">
            <div>
              <p className="font-display text-3xl font-bold text-foreground">{result.percentage.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Your score</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">{quiz.pass_percentage}%</p>
              <p className="text-sm text-muted-foreground">Pass mark</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => {
            useQuizStore.getState().resetSession();
            router.back();
          }}>Back to course</Button>
          {!result.passed && (
            <Button onClick={() => {
              setSubmitted(false);
              useQuizStore.getState().resetSession();
            }}>
              Retry quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (submitted && !result) return <PageLoader />;

  if (questions.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">This quiz has no questions yet.</div>;
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {participants > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4" />
                {participants}
              </div>
            )}

            {timeLeft !== null && (
              <div className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold",
                timeLeft < 60
                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                  : "border-border bg-card text-foreground"
              )}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}

            {leaderboard.length > 0 && (
              <Button
                variant={isLeaderboardOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleLeaderboard}
                className="gap-2"
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
            )}
          </div>
        </div>

        <Progress value={progress} className="h-2" />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {/* Question number bubble */}
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {currentQuestionIndex + 1}
          </span>
          <p className="pt-0.5 text-base font-semibold text-foreground leading-snug">
            {question.text}
          </p>
        </div>

        {question.marks > 1 && (
          <p className="mb-4 text-xs text-muted-foreground ml-10">{question.marks} marks</p>
        )}

        {/* Choices */}
        <div className="ml-10 space-y-2.5">
          {question.choices.map((choice) => {
            const isSelected = answers[question.id] === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => selectAnswer(question.id, choice.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                {choice.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      {isLeaderboardOpen && leaderboard.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Live Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.user.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary w-6">#{entry.rank}</span>
                  <div>
                    <p className="font-medium text-foreground">{entry.user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.attempts} attempt{entry.attempts !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{entry.best_score.toFixed(1)}</p>
                  <p className={cn(
                    "text-xs font-medium",
                    entry.passed ? "text-green-600" : "text-red-600"
                  )}>
                    {entry.passed ? "✓ Passed" : "✗ Failed"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {/* Dot map */}
        <div className="flex gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                i === currentQuestionIndex
                  ? "bg-primary scale-125"
                  : answers[q.id]
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={nextQuestion}
            disabled={!answers[question.id]}
            className="gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? "Submitting…" : "Submit quiz"}
          </Button>
        )}
      </div>

      {/* Unanswered warning */}
      {!allAnswered && currentQuestionIndex === questions.length - 1 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {questions.filter((q) => !answers[q.id]).length} question(s) unanswered — you can still submit.
        </div>
      )}
    </div>
  );
}
