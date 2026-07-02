// QuizHistoryPage — protected storefront page showing the signed-in trainee's
// attempt history for a single quiz. Lists every past attempt (append-only,
// never overwritten) with timestamp, score/maxScore, percentage, and a
// pass/fail badge. Gated by ProtectedRoute so only authenticated staff reach
// it; the data comes from useMyAttempts(quizId).

import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyAttempts,
  usePosition,
  useQuiz,
  useQuizzesByPosition,
} from "@/hooks/useQueries";
import { toAttemptView, toPositionView, toQuizView } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  History,
  Loader2,
  Target,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

/** Format a nanosecond Timestamp (bigint) as a readable local date-time. */
function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  if (Number.isNaN(ms)) return "Unknown date";
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuizHistoryPage() {
  const { id, quizId } = useParams({
    from: "/storefront-layout/position/$id/quizzes/$quizId/history",
  });
  const positionId = BigInt(id);
  const quizIdBig = BigInt(quizId);

  const { data: position, isLoading: positionLoading } =
    usePosition(positionId);
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizIdBig);
  const { data: attempts, isLoading: attemptsLoading } =
    useMyAttempts(quizIdBig);
  // Used only to confirm the quiz belongs to this position (defensive — the
  // route param already encodes the position, but this guards against stale
  // deep links after a quiz is moved or deleted).
  const { data: positionQuizzes } = useQuizzesByPosition(positionId);

  const isLoading = positionLoading || quizLoading || attemptsLoading;
  const attemptCount = attempts?.length ?? 0;
  const hasAttempts = !attemptsLoading && attemptCount > 0;
  const showEmpty = !isLoading && !hasAttempts && !!quiz;

  const quizView = quiz ? toQuizView(quiz) : null;
  const positionView = position ? toPositionView(position) : null;

  // Sort attempts newest-first so the most recent attempt is on top.
  const sortedAttempts = (attempts ?? [])
    .map((a) => toAttemptView(a))
    .sort((a, b) => Number(b.submittedAt - a.submittedAt));

  // Best score summary across all attempts.
  const bestPercentage =
    sortedAttempts.length > 0
      ? Math.max(...sortedAttempts.map((a) => a.percentage))
      : 0;
  const hasPassed = sortedAttempts.some((a) => a.passed);

  // Defensive: if the quiz doesn't belong to this position, show a not-found
  // state rather than a confusing mismatch.
  const quizBelongsToPosition =
    !positionQuizzes || positionQuizzes.some((q) => q.id === quizIdBig);

  return (
    <>
      {/* Breadcrumb + header band */}
      <Section variant="muted" className="py-10 sm:py-12">
        <nav
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="quiz_history.breadcrumb_home"
          >
            <Link to="/" data-ocid="quiz_history.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="quiz_history.breadcrumb_position"
          >
            <Link
              to="/position/$id"
              params={{ id }}
              data-ocid="quiz_history.breadcrumb_position_link"
            >
              {positionLoading
                ? "Loading…"
                : (positionView?.name ?? "Position")}
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="quiz_history.breadcrumb_quizzes"
          >
            <Link
              to="/position/$id/quizzes"
              params={{ id }}
              data-ocid="quiz_history.breadcrumb_quizzes_link"
            >
              Quizzes
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="truncate font-medium text-foreground"
            data-ocid="quiz_history.breadcrumb_current"
          >
            {quizLoading ? "Loading…" : (quizView?.title ?? "Quiz")}
          </span>
        </nav>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            <History className="size-3" /> Attempt history
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {quizLoading ? (
              <Skeleton
                className="h-10 w-56"
                data-ocid="quiz_history.title.loading_state"
              />
            ) : (
              (quizView?.title ?? "Quiz")
            )}
          </h1>
          {quizView?.description ? (
            <p className="max-w-2xl text-muted-foreground line-clamp-2">
              {quizView.description}
            </p>
          ) : null}
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading your attempts…"
              : `${attemptCount} ${attemptCount === 1 ? "attempt" : "attempts"} on record. Retakes are unlimited.`}
          </p>
        </div>
      </Section>

      {/* Attempts list */}
      <Section className="py-16 sm:py-20">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading your attempts…</span>
            </div>
            <div className="space-y-3">
              {["skel-1", "skel-2", "skel-3"].map((skel, i) => (
                <Skeleton
                  key={skel}
                  className="h-20 w-full rounded-xl"
                  data-ocid={`quiz_history.attempt.loading_state.${i + 1}`}
                />
              ))}
            </div>
          </div>
        ) : !quiz || !quizBelongsToPosition ? (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
            data-ocid="quiz_history.error_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ClipboardList className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Quiz not found
              </h2>
              <p className="text-sm text-muted-foreground">
                This quiz doesn&apos;t exist or doesn&apos;t belong to this
                position.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              data-ocid="quiz_history.error_state.back_button"
            >
              <Link
                to="/position/$id/quizzes"
                params={{ id }}
                data-ocid="quiz_history.error_state.back_link"
              >
                Back to quizzes
              </Link>
            </Button>
          </div>
        ) : showEmpty ? (
          <EmptyState
            ocid="quiz_history.empty_state"
            title="No attempts yet"
            description="You haven't taken this quiz yet. Take it now to see your score and pass/fail status here — retakes are unlimited."
            backLabel="Back to quizzes"
          />
        ) : (
          <section className="space-y-6" data-ocid="quiz_history.section">
            {/* Summary card — best score + pass status */}
            <Card className="bg-muted/30" data-ocid="quiz_history.summary">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Best score
                  </p>
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {bestPercentage}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Passing threshold
                  </p>
                  <p className="flex items-center gap-1.5 font-display text-2xl font-semibold tracking-tight">
                    <Target className="size-4 text-accent" />
                    {quizView?.passingPercentage ?? 0}%
                  </p>
                </div>
                <Badge
                  variant={hasPassed ? "default" : "secondary"}
                  className="gap-1 px-3 py-1 text-sm"
                  data-ocid="quiz_history.summary.status"
                >
                  {hasPassed ? (
                    <>
                      <CheckCircle2 className="size-3.5" /> Passed
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3.5" /> Not yet passed
                    </>
                  )}
                </Badge>
              </CardContent>
            </Card>

            {/* Attempt list — newest first */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <History className="size-5 text-primary" />
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Your attempts
                </h2>
                <span className="text-sm text-muted-foreground">
                  {attemptCount} {attemptCount === 1 ? "attempt" : "attempts"}
                </span>
              </div>
              <ol className="space-y-3">
                {sortedAttempts.map((attempt, index) => (
                  <motion.li
                    key={String(attempt.id)}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                      delay: index * 0.05,
                    }}
                  >
                    <Card
                      className="py-0"
                      data-ocid={`quiz_history.attempt.item.${index + 1}`}
                    >
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                        {/* Left — attempt number + timestamp */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary"
                            data-ocid={`quiz_history.attempt.number.${index + 1}`}
                          >
                            {attemptCount - index}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-medium leading-tight">
                              Attempt {attemptCount - index}
                            </p>
                            <p
                              className="text-xs text-muted-foreground"
                              data-ocid={`quiz_history.attempt.timestamp.${index + 1}`}
                            >
                              {formatTimestamp(attempt.submittedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Right — score + pass/fail badge */}
                        <div className="flex items-center gap-4">
                          <div
                            className="text-right"
                            data-ocid={`quiz_history.attempt.score.${index + 1}`}
                          >
                            <p className="font-display text-lg font-semibold leading-tight tracking-tight">
                              {attempt.score}/{attempt.total}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attempt.percentage}%
                            </p>
                          </div>
                          <Badge
                            variant={attempt.passed ? "default" : "destructive"}
                            className="gap-1"
                            data-ocid={`quiz_history.attempt.status.${index + 1}`}
                          >
                            {attempt.passed ? (
                              <>
                                <CheckCircle2 className="size-3.5" /> Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="size-3.5" /> Failed
                              </>
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* Retake CTA */}
            <div className="flex justify-center pt-2">
              <Button asChild data-ocid="quiz_history.retake_button">
                <Link
                  to="/position/$id/quizzes/$quizId/take"
                  params={{ id, quizId }}
                  data-ocid="quiz_history.retake_link"
                >
                  Take this quiz again
                </Link>
              </Button>
            </div>
          </section>
        )}
      </Section>
    </>
  );
}

export default QuizHistoryPage;
