// PositionCard — dark roadhouse tile for the storefront grid.
// Dark card (#1E1E1B via bg-card) with a subtle border, Oswald heading-font
// position name, and a small status badge for signed-in users derived from
// their quiz attempts for this position: "Certified" (any passed attempt),
// "In training" (attempts but none passed), or "Not started" (no attempts).
// Keeps the 4:3 cover photo or initial-letter placeholder and the link to
// /position/$id. Mobile-first.

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyAttempts, useQuizzesByPosition } from "@/hooks/useQueries";
import type { AttemptPublic, PositionView } from "@/types";
import { Link } from "@tanstack/react-router";
import { Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PositionStatus = "certified" | "in_training" | "not_started";

const STATUS_LABEL: Record<PositionStatus, string> = {
  certified: "Certified",
  in_training: "In training",
  not_started: "Not started",
};

/**
 * Loads attempts for a single quiz and reports them up via render-prop.
 * Exists so `useMyAttempts` is called at the top level of a component (not
 * inside a loop), satisfying the Rules of Hooks.
 */
function QuizAttempts({
  quizId,
  onAttempts,
}: {
  quizId: bigint;
  onAttempts: (attempts: AttemptPublic[] | undefined) => void;
}) {
  const { data, isLoading } = useMyAttempts(quizId);
  useEffect(() => {
    onAttempts(isLoading ? undefined : (data ?? []));
  }, [data, isLoading, onAttempts]);
  return null;
}

/**
 * Derive a position's training status for the signed-in user from their quiz
 * attempts. Loads the position's quizzes, then each quiz's attempts, and
 * reduces them to a single status. Returns null when the user is not signed
 * in (no badge shown) or while the data is still loading.
 */
function usePositionStatus(
  positionId: bigint | undefined,
  isAuthenticated: boolean,
): {
  status: PositionStatus | null;
  isLoading: boolean;
  quizIds: bigint[];
  registerAttempts: (
    quizId: bigint,
    attempts: AttemptPublic[] | undefined,
  ) => void;
} {
  const quizzesQuery = useQuizzesByPosition(
    isAuthenticated ? positionId : undefined,
  );
  const quizzes = quizzesQuery.data ?? [];
  const quizIds = quizzes.map((q) => q.id);

  const [attemptsByQuiz, setAttemptsByQuiz] = useState<
    Record<string, AttemptPublic[] | undefined>
  >({});

  const registerAttempts = useCallback(
    (quizId: bigint, attempts: AttemptPublic[] | undefined) => {
      const key = String(quizId);
      setAttemptsByQuiz((prev) => {
        if (prev[key] === attempts) return prev;
        return { ...prev, [key]: attempts };
      });
    },
    [],
  );

  if (!isAuthenticated) {
    return {
      status: null,
      isLoading: false,
      quizIds: [],
      registerAttempts,
    };
  }

  const quizzesReady = !quizzesQuery.isLoading && quizzesQuery.isSuccess;
  if (!quizzesReady) {
    return { status: null, isLoading: true, quizIds, registerAttempts };
  }

  // Every quiz must have reported its attempts (defined) before we decide.
  const allReported = quizIds.every(
    (id) => attemptsByQuiz[String(id)] !== undefined,
  );
  if (!allReported) {
    return { status: null, isLoading: true, quizIds, registerAttempts };
  }

  const allAttempts = quizIds.flatMap((id) => attemptsByQuiz[String(id)] ?? []);
  if (allAttempts.length === 0) {
    return {
      status: "not_started",
      isLoading: false,
      quizIds,
      registerAttempts,
    };
  }
  const passed = allAttempts.some((a) => a.passed);
  return {
    status: passed ? "certified" : "in_training",
    isLoading: false,
    quizIds,
    registerAttempts,
  };
}

function StatusBadge({ status }: { status: PositionStatus }) {
  if (status === "certified") {
    return (
      <Badge
        className="border-success/30 bg-success/15 text-success"
        data-ocid="position.status.certified"
      >
        <CheckCircle2 className="size-3" />
        {STATUS_LABEL.certified}
      </Badge>
    );
  }
  if (status === "in_training") {
    return (
      <Badge
        className="border-accent/30 bg-accent/15 text-accent"
        data-ocid="position.status.in_training"
      >
        {STATUS_LABEL.in_training}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-border bg-card/80 text-muted-foreground"
      data-ocid="position.status.not_started"
    >
      {STATUS_LABEL.not_started}
    </Badge>
  );
}

export function PositionCard({
  position,
  index,
}: {
  position: PositionView;
  index: number;
}) {
  const count = position.categoryCount;
  const hasCover = position.coverUrl && position.coverUrl.length > 0;
  const initial = position.name.trim().charAt(0).toUpperCase();
  const { isAuthenticated } = useAuth();
  const { status, isLoading, quizIds, registerAttempts } = usePositionStatus(
    position.id,
    isAuthenticated,
  );

  return (
    <Link
      to="/position/$id"
      params={{ id: String(position.id) }}
      className="group block focus-visible:outline-none"
      data-ocid={`home.position.item.${index + 1}`}
      aria-label={`Browse ${position.name} position`}
    >
      <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-elevated group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {hasCover ? (
            <img
              src={position.coverUrl}
              alt={position.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            // Dark placeholder tile for positions without a cover photo.
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-smooth group-hover:scale-105">
                {initial ? (
                  <span className="font-display text-3xl font-semibold">
                    {initial}
                  </span>
                ) : (
                  <Briefcase className="size-9" />
                )}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />

          {/* Status badge — only for signed-in users, top-right of the cover */}
          {isAuthenticated && (
            <div className="absolute right-2 top-2">
              {isLoading ? (
                <Loader2
                  className="size-4 animate-spin text-foreground/80"
                  aria-label="Loading status"
                />
              ) : status ? (
                <StatusBadge status={status} />
              ) : null}
            </div>
          )}

          {/* Hidden children that fetch per-quiz attempts (Rules of Hooks safe) */}
          {quizIds.map((qid) => (
            <QuizAttempts
              key={String(qid)}
              quizId={qid}
              onAttempts={(attempts) => registerAttempts(qid, attempts)}
            />
          ))}
        </div>

        {/* Dark footer — Oswald heading name + category count */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <h3 className="font-heading text-lg font-semibold uppercase leading-tight tracking-wide line-clamp-1 text-foreground">
            {position.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Briefcase className="size-3 text-primary" />
            {count} {count === 1 ? "category" : "categories"}
          </span>
        </div>
      </article>
    </Link>
  );
}
