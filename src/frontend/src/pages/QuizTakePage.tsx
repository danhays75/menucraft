// Quiz take page — ProtectedRoute-gated. Fetches the quiz + its ordered
// questions, renders each question with the matching answer control (radio for
// single-answer, checkbox for multiple-answer), collects the trainee's
// selections, and submits an append-only attempt via useSubmitAttempt. On
// success it navigates to the results route, passing the attempt, quiz, and
// questions through router state so the results screen can render the
// per-question review without an extra round-trip.

import { Section } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestions, useQuiz, useSubmitAttempt } from "@/hooks/useQueries";
import type { AttemptAnswerPublic, QuestionView, QuizView } from "@/types";
import { toQuestionView, toQuizView } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/** Selections keyed by question id → set of selected option ids. */
type Selections = Record<string, bigint[]>;

export function QuizTakePage() {
  const { id, quizId } = useParams({
    from: "/storefront-layout/position/$id/quizzes/$quizId/take",
  });
  const positionId = BigInt(id);
  const quizIdBig = BigInt(quizId);
  const navigate = useNavigate();

  const quizQuery = useQuiz(quizIdBig);
  const questionsQuery = useQuestions(quizIdBig);
  const submit = useSubmitAttempt();

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

  const [selections, setSelections] = useState<Selections>({});
  const [current, setCurrent] = useState(0);

  const isLoading = quizQuery.isLoading || questionsQuery.isLoading;
  const total = questions.length;
  const isLast = current === total - 1;
  const answeredCount = questions.filter(
    (q) => (selections[String(q.id)] ?? []).length > 0,
  ).length;
  const allAnswered = answeredCount === total;

  /* ---- Answer handlers ---- */
  const setSingle = (questionId: bigint, optionId: bigint) => {
    setSelections((prev) => ({ ...prev, [String(questionId)]: [optionId] }));
  };

  const toggleMultiple = (questionId: bigint, optionId: bigint) => {
    setSelections((prev) => {
      const current = new Set(prev[String(questionId)] ?? []);
      if (current.has(optionId)) current.delete(optionId);
      else current.add(optionId);
      return { ...prev, [String(questionId)]: [...current] };
    });
  };

  /* ---- Submit ---- */
  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error("Please answer every question before submitting.");
      return;
    }
    const answers: AttemptAnswerPublic[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: selections[String(q.id)] ?? [],
    }));
    try {
      const attempt = await submit.mutateAsync({
        quizId: quizIdBig,
        answers,
      });
      navigate({
        to: "/position/$id/quizzes/$quizId/results",
        params: { id, quizId },
        // Router state is typed as a flat HistoryState; we pass typed objects
        // through it (consumed by QuizResultsPage) and assert the shape here.
        state: { attempt, quiz, questions } as never,
      });
    } catch {
      toast.error("Couldn't submit your attempt. Please try again.");
    }
  };

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <Section className="py-12 sm:py-16" data-ocid="quiz.take.loading_state">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="flex justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </Section>
    );
  }

  /* ---- Error / not-found state ---- */
  if (!quiz) {
    return (
      <Section className="py-16 sm:py-20" data-ocid="quiz.take.error_state">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <ClipboardList className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
              Quiz not found
            </h2>
            <p className="text-sm text-muted-foreground">
              This quiz may have been removed. Pick another quiz from the
              position to continue.
            </p>
            <Button
              asChild
              variant="outline"
              data-ocid="quiz.take.error_state.back_button"
            >
              <a
                href={`/position/${positionId}/quizzes`}
                data-ocid="quiz.take.error_state.back_link"
              >
                Back to quizzes
              </a>
            </Button>
          </CardContent>
        </Card>
      </Section>
    );
  }

  /* ---- Empty (no questions) state ---- */
  if (total === 0) {
    return (
      <Section className="py-16 sm:py-20" data-ocid="quiz.take.empty_state">
        <Card className="mx-auto max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <ClipboardList className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wide">
              No questions yet
            </h2>
            <p className="text-sm text-muted-foreground">
              {quiz.title} doesn&apos;t have any questions configured yet. Check
              back soon.
            </p>
            <Button
              asChild
              variant="outline"
              data-ocid="quiz.take.empty_state.back_button"
            >
              <a
                href={`/position/${positionId}/quizzes`}
                data-ocid="quiz.take.empty_state.back_link"
              >
                Back to quizzes
              </a>
            </Button>
          </CardContent>
        </Card>
      </Section>
    );
  }

  const question = questions[current];
  const selected = selections[String(question.id)] ?? [];
  const percent = Math.round(((current + 1) / total) * 100);

  return (
    <Section className="py-10 sm:py-14" data-ocid="quiz.take.page">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header — quiz context + progress */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ClipboardList className="size-3.5 text-primary" />
                Quiz
              </span>
              <h1 className="mt-1 truncate font-heading text-2xl font-bold uppercase tracking-wide sm:text-3xl">
                {quiz.title}
              </h1>
              {quiz.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {quiz.description}
                </p>
              ) : null}
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="quiz.take.exit_button"
            >
              <a
                href={`/position/${positionId}/quizzes`}
                data-ocid="quiz.take.exit_link"
              >
                Exit quiz
              </a>
            </Button>
          </div>

          <div data-ocid="quiz.take.progress">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Question{" "}
                <span
                  className="font-heading text-lg font-bold uppercase tracking-wide text-primary"
                  data-ocid="quiz.take.progress.current"
                >
                  {current + 1}
                </span>{" "}
                of{" "}
                <span
                  className="text-muted-foreground"
                  data-ocid="quiz.take.progress.total"
                >
                  {total}
                </span>
              </span>
              <span
                className="text-xs font-medium tabular-nums text-muted-foreground"
                data-ocid="quiz.take.progress.percent"
              >
                {percent}%
              </span>
            </div>
            <Progress
              value={percent}
              className="h-2.5"
              data-ocid="quiz.take.progress.bar"
            />
          </div>
        </div>

        {/* Question card — animated transitions between questions. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Card data-ocid={`quiz.take.question.${current + 1}`}>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-heading text-sm font-bold text-primary">
                    {current + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-heading text-lg font-semibold uppercase leading-snug tracking-wide">
                      {question.text}
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {question.type === "single"
                        ? "Choose one answer"
                        : "Choose all that apply"}
                    </p>
                  </div>
                </div>

                {question.type === "single" ? (
                  <RadioGroup
                    value={selected[0] !== undefined ? String(selected[0]) : ""}
                    onValueChange={(val) => setSingle(question.id, BigInt(val))}
                    className="gap-2.5"
                    data-ocid={`quiz.take.radio.${current + 1}`}
                  >
                    {question.options.map((opt, i) => {
                      const optId = `q${current + 1}-opt-${i + 1}`;
                      return (
                        <Label
                          key={String(opt.id)}
                          htmlFor={optId}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-smooth hover:border-primary/50 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                          data-ocid={`quiz.take.option.${current + 1}.${i + 1}`}
                        >
                          <RadioGroupItem
                            id={optId}
                            value={String(opt.id)}
                            data-ocid={`quiz.take.radio_item.${current + 1}.${i + 1}`}
                          />
                          <span className="text-sm leading-snug">
                            {opt.text}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                ) : (
                  <div
                    className="grid gap-2.5"
                    data-ocid={`quiz.take.checkbox_group.${current + 1}`}
                  >
                    {question.options.map((opt, i) => {
                      const optId = `q${current + 1}-opt-${i + 1}`;
                      const checked = selected.includes(opt.id);
                      return (
                        <Label
                          key={String(opt.id)}
                          htmlFor={optId}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-smooth hover:border-primary/50 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                          data-ocid={`quiz.take.option.${current + 1}.${i + 1}`}
                        >
                          <Checkbox
                            id={optId}
                            checked={checked}
                            onCheckedChange={() =>
                              toggleMultiple(question.id, opt.id)
                            }
                            data-ocid={`quiz.take.checkbox.${current + 1}.${i + 1}`}
                          />
                          <span className="text-sm leading-snug">
                            {opt.text}
                          </span>
                        </Label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Nav controls — Back / Next-or-Submit, one primary per section. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="flex items-center justify-between gap-3"
          data-ocid="quiz.take.nav"
        >
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            data-ocid="quiz.take.back_button"
            aria-label="Previous question"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            data-ocid="quiz.take.nav.hint"
          >
            {answeredCount} of {total} answered
          </span>

          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={submit.isPending || !allAnswered}
              data-ocid="quiz.take.submit_button"
            >
              {submit.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Submit attempt
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={selected.length === 0}
              data-ocid="quiz.take.next_button"
              aria-label="Next question"
            >
              Next
              <Plus className="size-4" />
            </Button>
          )}
        </motion.div>

        {/* Submit-disabled hint — explains what's missing without blocking. */}
        {isLast && !allAnswered ? (
          <p
            className="text-center text-xs text-muted-foreground"
            data-ocid="quiz.take.submit_hint"
          >
            <Minus className="mr-1 inline size-3" />
            Answer all {total} questions to submit your attempt.
          </p>
        ) : null}
      </div>
    </Section>
  );
}

export default QuizTakePage;
