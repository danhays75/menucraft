// Training flow page — gated behind ProtectedRoute (staff login). Fetches the
// menu item + its training steps, then walks the user through one step at a
// time with an in-session progress indicator. Current-step state lives in
// useState, so it resets whenever the user exits or re-enters the flow (no
// persistent per-staff progress — by design).

import { TrainingComplete } from "@/components/TrainingComplete";
import { TrainingProgress } from "@/components/TrainingProgress";
import { TrainingStepView } from "@/components/TrainingStepView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMenuItem, useTrainingSteps } from "@/hooks/useQueries";
import type { ItemId } from "@/types";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChefHat, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

export function TrainingPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const itemId = useMemo<ItemId | undefined>(
    () => (id ? BigInt(id) : undefined),
    [id],
  );

  const itemQuery = useMenuItem(itemId);
  const stepsQuery = useTrainingSteps(itemId);

  // In-session step cursor. Resets on unmount (and on re-entry) because this
  // is component-local state — no persistence, by requirement.
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const isLoading = itemQuery.isLoading || stepsQuery.isLoading;
  const item = itemQuery.data ?? null;
  const steps = stepsQuery.data ?? [];
  const total = steps.length;
  const isComplete = total > 0 && current >= total;

  const goNext = () => {
    if (current < total) {
      setDirection(1);
      setCurrent((c) => c + 1);
    }
  };
  const goBack = () => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
    }
  };

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        data-ocid="training.loading_state"
      >
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading training"
        />
      </div>
    );
  }

  /* ---- Error / empty state ---- */
  if (!item) {
    return (
      <div
        className="mx-auto max-w-md px-4 py-20"
        data-ocid="training.error_state"
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ChefHat className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t load this recipe. It may have been removed.
            </p>
            <Button
              asChild
              variant="outline"
              data-ocid="training.error_state.home_button"
            >
              <a href="/" data-ocid="training.error_state.home_link">
                Back to menu
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div
        className="mx-auto max-w-md px-4 py-20"
        data-ocid="training.empty_state"
      >
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ChefHat className="size-8 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">
              No training steps yet
            </h2>
            <p className="text-sm text-muted-foreground">
              {item.name} doesn&apos;t have a training flow configured. Check
              back soon.
            </p>
            <Button
              asChild
              variant="outline"
              data-ocid="training.empty_state.review_button"
            >
              <a
                href={`/item/${item.id}`}
                data-ocid="training.empty_state.review_link"
              >
                View the recipe
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Completion screen ---- */
  if (isComplete) {
    return (
      <section className="py-16 sm:py-20" data-ocid="training.page">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <TrainingComplete
            itemId={item.id}
            itemName={item.name}
            totalSteps={total}
          />
        </div>
      </section>
    );
  }

  /* ---- Active step ---- */
  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === total - 1;

  return (
    <section className="py-10 sm:py-14" data-ocid="training.page">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Header — item context + progress */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <ChefHat className="size-3.5 text-primary" />
                Staff training
              </span>
              <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.name}
              </h1>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="training.exit_button"
            >
              <a href={`/item/${item.id}`} data-ocid="training.exit_link">
                Exit training
              </a>
            </Button>
          </div>

          <TrainingProgress current={current + 1} total={total} />
        </div>

        {/* Step body — animated transitions between steps. */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <TrainingStepView
              key={current}
              step={step}
              index={current}
              direction={direction}
            />
          </AnimatePresence>
        </div>

        {/* Nav controls — Back / Next, one primary action per section. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="mt-6 flex items-center justify-between gap-3"
          data-ocid="training.nav"
        >
          <Button
            variant="outline"
            onClick={goBack}
            disabled={isFirst}
            data-ocid="training.back_button"
            aria-label="Previous step"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <span
            className="text-xs text-muted-foreground"
            data-ocid="training.nav.hint"
          >
            {isLast ? "Final step" : "Continue to the next step"}
          </span>

          <Button
            onClick={goNext}
            data-ocid="training.next_button"
            aria-label={isLast ? "Finish training" : "Next step"}
          >
            {isLast ? "Finish" : "Next"}
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
