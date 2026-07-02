// Quiz results page — ProtectedRoute-gated. Reads the just-submitted attempt,
// the quiz, and the ordered questions from router state (passed by
// QuizTakePage on submit). Falls back to refetching the latest attempt via
// useMyAttempts when the user lands here directly (e.g. refresh / history) so
// the review still renders. Shows the score, max score, pass/fail status, and
// passing percentage, then lists each question with the user's selected
// answer(s) vs the correct answer(s), highlighting incorrect ones. Offers an
// unlimited-retake action and a back-to-quizzes link.

import { Section } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAttempts, useQuestions, useQuiz } from "@/hooks/useQueries";
import type {
  AttemptPublic,
  AttemptView,
  QuestionView,
  QuizView,
} from "@/types";
import { toAttemptView, toQuestionView, toQuizView } from "@/types";
import { useLocation, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

/** Router state shape passed from QuizTakePage on submit. */
interface ResultsState {
  attempt?: AttemptPublic;
  quiz?: QuizView | null;
  questions?: QuestionView[];
}

export function QuizResultsPage() {
  const { id, quizId } = useParams({
    from: "/storefront-layout/position/$id/quizzes/$quizId/results",
  });
  const positionId = BigInt(id);
  const quizIdBig = BigInt(quizId);
  const location = useLocation();

  const state = (location.state ?? {}) as ResultsState;

  const quizQuery = useQuiz(quizIdBig);
  const questionsQuery = useQuestions(quizIdBig);
  const myAttemptsQuery = useMyAttempts(quizIdBig);

  const quiz: QuizView | null = quizQuery.data
    ? toQuizView(quizQuery.data)
    : null;
  const questions: QuestionView[] = useMemo(
    () =>
      (questionsQuery.data ?? [])
        .map(toQuestionView)
        .sort((a, b) => a.order - b.order),
    [questionsQuery.data],
  );

  // Prefer the attempt passed through router state (just-submitted). When
  // absent (direct navigation / refresh), fall back to the most recent of the
  // user's attempts for this quiz.
  const attemptRaw: AttemptPublic | undefined =
    state.attempt ??
    (myAttemptsQuery.data && myAttemptsQuery.data.length > 0
      ? [...myAttemptsQuery.data].sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt),
        )[0]
      : undefined);
  const attempt: AttemptView | null = attemptRaw
    ? toAttemptView(attemptRaw)
    : null;

  const isLoading =
    !state.attempt &&
    (quizQuery.isLoading ||
      questionsQuery.isLoading ||
      myAttemptsQuery.isLoading);

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <Section
        className="py-12 sm:py-16"
        data-ocid="quiz.results.loading_state"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="mx-auto h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Section>
    );
  }

  /* ---- No attempt yet state ---- */
  if (!attempt) {
    return (
      <Section className="py-16 sm:py-20" data-ocid="quiz.results.empty_state">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <ClipboardList className="size-8 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">
              No attempt to review
            </h2>
            <p className="text-sm text-muted-foreground">
              You haven&apos;t taken this quiz yet. Start an attempt to see your
              results here.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild data-ocid="quiz.results.empty_state.take_button">
                <a
                  href={`/position/${positionId}/quizzes/${quizId}/take`}
                  data-ocid="quiz.results.empty_state.take_link"
                >
                  Take quiz
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                data-ocid="quiz.results.empty_state.back_button"
              >
                <a
                  href={`/position/${positionId}/quizzes`}
                  data-ocid="quiz.results.empty_state.back_link"
                >
                  Back to quizzes
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    );
  }

  const passed = attempt.passed;
  const percentage = attempt.percentage;
  const passingPct = quiz?.passingPercentage ?? 0;
  const scorePct = Math.max(0, Math.min(100, percentage));

  return (
    <Section className="py-10 sm:py-14" data-ocid="quiz.results.page">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
          data-ocid="quiz.results.breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="quiz.results.breadcrumb_back"
          >
            <a
              href={`/position/${positionId}/quizzes`}
              data-ocid="quiz.results.breadcrumb_back_link"
            >
              <ArrowLeft className="size-3.5" /> Quizzes
            </a>
          </Button>
        </nav>

        {/* Score summary card — pass/fail hero with score, max, passing %. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Card data-ocid="quiz.results.summary">
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className={`flex size-16 items-center justify-center rounded-full ${
                    passed
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                  data-ocid="quiz.results.summary.icon"
                >
                  {passed ? (
                    <CheckCircle2 className="size-8" />
                  ) : (
                    <XCircle className="size-8" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <h1 className="font-display text-3xl font-semibold tracking-tight">
                    {passed ? "You passed!" : "Not quite yet"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {quiz?.title ?? "Quiz"} ·{" "}
                    <span className="tabular-nums">
                      {attempt.score} of {attempt.total} correct
                    </span>
                  </p>
                </div>
                <Badge
                  variant={passed ? "default" : "destructive"}
                  className="px-3 py-1 text-sm"
                  data-ocid="quiz.results.summary.status_badge"
                >
                  {passed ? "Passed" : "Failed"}
                </Badge>
              </div>

              {/* Score bar — fills to the achieved percentage, with the
                  passing threshold marked. */}
              <div className="space-y-2" data-ocid="quiz.results.score_bar">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">
                    Your score
                  </span>
                  <span
                    className="font-display text-2xl font-semibold tabular-nums text-primary"
                    data-ocid="quiz.results.summary.percentage"
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="relative">
                  <Progress
                    value={scorePct}
                    className="h-3"
                    data-ocid="quiz.results.summary.progress"
                  />
                  {passingPct > 0 && passingPct < 100 ? (
                    <span
                      className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-foreground/60"
                      style={{ left: `${passingPct}%` }}
                      aria-label={`Passing threshold: ${passingPct}%`}
                      data-ocid="quiz.results.summary.threshold"
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Passing threshold:{" "}
                    <span className="font-medium text-foreground">
                      {passingPct}%
                    </span>
                  </span>
                  <span>
                    Score:{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {attempt.score}/{attempt.total}
                    </span>
                  </span>
                </div>
              </div>

              {/* Actions — retake (unlimited) + back to quizzes. */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild data-ocid="quiz.results.retake_button">
                  <a
                    href={`/position/${positionId}/quizzes/${quizId}/take`}
                    data-ocid="quiz.results.retake_link"
                  >
                    <RotateCcw className="size-4" />
                    Retake quiz
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  data-ocid="quiz.results.back_button"
                >
                  <a
                    href={`/position/${positionId}/quizzes`}
                    data-ocid="quiz.results.back_link"
                  >
                    Back to quizzes
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-question review — selected vs correct, incorrect highlighted. */}
        <div className="space-y-4" data-ocid="quiz.results.review.section">
          <div className="flex items-center gap-2.5">
            <ListChecks className="size-5 text-primary" />
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Answer review
            </h2>
            <span className="text-sm text-muted-foreground">
              {questions.length}{" "}
              {questions.length === 1 ? "question" : "questions"}
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const answer = attempt.answers.find((a) => a.questionId === q.id);
              const selectedIds = new Set(answer?.selectedOptionIds ?? []);
              const correctIds = new Set(
                q.options.filter((o) => o.isCorrect).map((o) => o.id),
              );
              const isCorrect =
                selectedIds.size === correctIds.size &&
                [...selectedIds].every((id) => correctIds.has(id));

              return (
                <ReviewQuestion
                  key={String(q.id)}
                  question={q}
                  index={index}
                  selectedIds={selectedIds}
                  correctIds={correctIds}
                  isCorrect={isCorrect}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Per-question review card                                            */
/* ------------------------------------------------------------------ */

function ReviewQuestion({
  question,
  index,
  selectedIds,
  correctIds,
  isCorrect,
}: {
  question: QuestionView;
  index: number;
  selectedIds: Set<bigint>;
  correctIds: Set<bigint>;
  isCorrect: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
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
          data-ocid={`quiz.results.review.item.${index + 1}`}
          className={
            isCorrect ? undefined : "border-destructive/40 bg-destructive/5"
          }
        >
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  isCorrect
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
                data-ocid={`quiz.results.review.status.${index + 1}`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <XCircle className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Question {index + 1}
                  </span>
                  <Badge
                    variant={isCorrect ? "secondary" : "destructive"}
                    className="text-[10px]"
                    data-ocid={`quiz.results.review.badge.${index + 1}`}
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug">
                  {question.text}
                </h3>
              </div>
            </div>

            {/* Options — show selected + correct markers side by side. */}
            <ul
              className="space-y-2"
              data-ocid={`quiz.results.review.options.${index + 1}`}
            >
              {question.options.map((opt, i) => {
                const wasSelected = selectedIds.has(opt.id);
                const isCorrectOpt = correctIds.has(opt.id);
                // Highlight: correct+selected (green), correct+not-selected
                // (green outline — the missed correct), selected+incorrect
                // (red — the wrong pick), otherwise neutral.
                const tone = isCorrectOpt
                  ? wasSelected
                    ? "correct-selected"
                    : "correct-missed"
                  : wasSelected
                    ? "incorrect-selected"
                    : "neutral";

                return (
                  <li
                    key={String(opt.id)}
                    className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
                      tone === "correct-selected"
                        ? "border-success/50 bg-success/10 text-foreground"
                        : tone === "correct-missed"
                          ? "border-success/40 bg-success/5 text-foreground"
                          : tone === "incorrect-selected"
                            ? "border-destructive/50 bg-destructive/10 text-foreground"
                            : "border-border bg-background text-muted-foreground"
                    }`}
                    data-ocid={`quiz.results.review.option.${index + 1}.${i + 1}`}
                  >
                    <span className="mt-0.5 flex shrink-0 items-center gap-1">
                      {wasSelected ? (
                        <CheckCircle2
                          className={`size-4 ${
                            isCorrectOpt ? "text-success" : "text-destructive"
                          }`}
                        />
                      ) : isCorrectOpt ? (
                        <span
                          className="size-4 rounded-full border-2 border-success/60"
                          aria-label="Correct answer (not selected)"
                        />
                      ) : (
                        <span className="size-4 rounded-full border border-border" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">
                      {opt.text}
                    </span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-1">
                      {wasSelected ? (
                        <Badge
                          variant="outline"
                          className="border-current/30 text-[10px]"
                          data-ocid={`quiz.results.review.your_answer.${index + 1}.${i + 1}`}
                        >
                          Your answer
                        </Badge>
                      ) : null}
                      {isCorrectOpt ? (
                        <Badge
                          variant="outline"
                          className="border-success/40 text-[10px] text-success"
                          data-ocid={`quiz.results.review.correct_answer.${index + 1}.${i + 1}`}
                        >
                          Correct
                        </Badge>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Inline summary when the user got it wrong. */}
            {!isCorrect ? (
              <p
                className="text-xs text-muted-foreground"
                data-ocid={`quiz.results.review.summary.${index + 1}`}
              >
                {selectedIds.size === 0
                  ? "You didn't select an answer for this question."
                  : "Compare your selection with the marked correct answer(s) above."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default QuizResultsPage;
