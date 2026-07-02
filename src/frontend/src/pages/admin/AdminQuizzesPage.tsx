// Admin — Manage quizzes page. Header with create button, the QuizList table
// (title, position name, question count, passing %, edit link + delete), and
// the QuizFormDialog for create / edit. Loading and empty states are handled
// by the list component itself.
//
// Mirrors AdminPositionsPage. The backend has no `listQuizzes` method, so we
// gather quizzes across every position by combining `usePositions` with a
// per-position `useQuizzesByPosition` (rendered through a child component so
// the hook is called unconditionally at the top level of that component).
// Position names come from the same `usePositions` result so the "Position"
// column reads as a human name.

import { QuizFormDialog } from "@/components/admin/QuizFormDialog";
import { QuizList } from "@/components/admin/QuizList";
import { Button } from "@/components/ui/button";
import { usePositions, useQuizzesByPosition } from "@/hooks/useQueries";
import type { PositionId, QuizPublic } from "@/types";
import { toQuizView } from "@/types";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AdminQuizzesPage() {
  const { data: positions = [], isLoading: positionsLoading } = usePositions();

  const [dialogOpen, setDialogOpen] = useState(false);
  // The dialog edits a raw QuizPublic (it needs positionId as bigint). The
  // list works with QuizView. We keep both in sync by looking the raw record
  // up from `quizData` when the page opens the edit dialog for a view.
  const [editingId, setEditingId] = useState<bigint | null>(null);

  // Aggregated quiz data across all positions. Each <PositionQuizzes> child
  // reports its slice here via setState; we merge by positionId so re-renders
  // from one position don't clobber another's results.
  const [slices, setSlices] = useState<
    Record<
      string,
      { quizzes: QuizPublic[]; isLoading: boolean; error: unknown }
    >
  >({});

  function openCreate() {
    setEditingId(null);
    setDialogOpen(true);
  }

  const isLoading =
    positionsLoading ||
    (positions.length > 0 && Object.keys(slices).length < positions.length) ||
    Object.values(slices).some((s) => s.isLoading);
  const firstError = Object.values(slices).find((s) => s.error)?.error ?? null;

  // Flatten every position's quizzes into a single list, newest-first.
  const quizData: QuizPublic[] = useMemo(() => {
    const all: QuizPublic[] = [];
    for (const s of Object.values(slices)) all.push(...s.quizzes);
    return all.sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [slices]);

  // Map backend QuizPublic rows into display-ready QuizView rows.
  const quizzes = useMemo(() => quizData.map(toQuizView), [quizData]);
  // positionId -> position name lookup for the "Position" column.
  const positionNames = useMemo(() => {
    const map = new Map<bigint, string>();
    for (const p of positions) {
      map.set(BigInt(p.id), p.name);
    }
    return map;
  }, [positions]);

  const editing: QuizPublic | null =
    editingId !== null
      ? (quizData.find((q) => q.id === editingId) ?? null)
      : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Hidden aggregators — one per position. Each calls the hook once at
          its top level and reports its slice upward via setState. */}
      <div className="hidden">
        {positions.map((p) => (
          <PositionQuizzes
            key={String(p.id)}
            positionId={p.id}
            onResult={(r) =>
              setSlices((prev) => ({
                ...prev,
                [String(p.id)]: r,
              }))
            }
          />
        ))}
      </div>

      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Quizzes
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage quizzes attached to positions. Edit a quiz to add
            questions and mark correct answers.
          </p>
        </div>
        <Button onClick={openCreate} data-ocid="quiz.create_button">
          <Plus className="size-4" /> New quiz
        </Button>
      </header>

      {/* Body */}
      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-20"
          data-ocid="quiz.loading_state"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : firstError ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center"
          data-ocid="quiz.error_state"
        >
          <p className="font-medium text-destructive">Could not load quizzes</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {firstError instanceof Error
              ? firstError.message
              : "Please try again later."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            data-ocid="quiz.retry_button"
          >
            Retry
          </Button>
        </div>
      ) : (
        <QuizList quizzes={quizzes} positionNames={positionNames} />
      )}

      <QuizFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quiz={editing}
      />
    </div>
  );
}

/**
 * Calls `useQuizzesByPosition` for one position and reports the result upward
 * via `onResult` (a setState callback from the parent). Rendered hidden by
 * the parent so the hook is called at the top level of this component
 * (Rules of Hooks) while the parent aggregates the slices.
 */
function PositionQuizzes({
  positionId,
  onResult,
}: {
  positionId: PositionId;
  onResult: (r: {
    quizzes: QuizPublic[];
    isLoading: boolean;
    error: unknown;
  }) => void;
}) {
  const { data, isLoading, error } = useQuizzesByPosition(positionId);
  useEffect(() => {
    onResult({ quizzes: data ?? [], isLoading, error });
  }, [data, isLoading, error, onResult]);
  return null;
}

export default AdminQuizzesPage;
