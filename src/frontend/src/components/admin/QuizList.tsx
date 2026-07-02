// Quiz table — title, position name, question count, passing percentage, and
// edit / delete actions. Edit navigates to /admin/quizzes/$quizId (the quiz
// edit page where questions are managed). Delete shows an AlertDialog
// confirmation; the backend's deleteQuiz returns Bool — on success we toast,
// on failure we surface a blocked dialog explaining the quiz was not deleted.
//
// Mirrors PositionList's table + confirmation-dialog pattern, but WITHOUT
// sort-order controls (quizzes are ordered by creation, not admin-reorderable
// in this build).

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteQuiz } from "@/hooks/useQueries";
import type { QuizView } from "@/types";
import { Link } from "@tanstack/react-router";
import { ClipboardList, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface QuizListProps {
  quizzes: QuizView[];
  /** positionId -> position name, for the "Position" column. */
  positionNames: Map<bigint, string>;
}

export function QuizList({ quizzes, positionNames }: QuizListProps) {
  const deleteMut = useDeleteQuiz();

  // Sort by createdAt ascending (oldest first) for a stable list.
  const sorted = [...quizzes].sort(
    (a, b) => Number(a.createdAt) - Number(b.createdAt),
  );

  // The quiz the admin is currently confirming deletion for.
  const [pendingDelete, setPendingDelete] = useState<QuizView | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync({
        quizId: BigInt(pendingDelete.id),
        positionId: BigInt(pendingDelete.positionId),
      });
      toast.success("Quiz deleted");
    } catch (err) {
      toast.error("Could not delete quiz");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setPendingDelete(null);
    }
  }

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
        data-ocid="quiz.empty_state"
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <ClipboardList className="size-5" />
        </div>
        <p className="font-heading text-lg font-semibold uppercase tracking-wide">
          No quizzes yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first quiz to start testing your team on a position's menu
          knowledge.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table data-ocid="quiz.table">
          <TableHeader>
            <TableRow className="border-b-2 border-primary/50 bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                #
              </TableHead>
              <TableHead className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </TableHead>
              <TableHead className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Position
              </TableHead>
              <TableHead className="text-right font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Questions
              </TableHead>
              <TableHead className="text-right font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pass %
              </TableHead>
              <TableHead className="w-28 text-right font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((quiz, index) => {
              const positionName =
                positionNames.get(BigInt(quiz.positionId)) ?? "—";
              return (
                <TableRow
                  key={String(quiz.id)}
                  data-ocid={`quiz.row.${index + 1}`}
                >
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {quiz.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {positionName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className="border-accent/40 bg-accent/10 text-accent"
                      data-ocid={`quiz.question_count.${index + 1}`}
                    >
                      {quiz.questionCount}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    data-ocid={`quiz.pass_percent.${index + 1}`}
                  >
                    {quiz.passingPercentage}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${quiz.title}`}
                        data-ocid={`quiz.edit_button.${index + 1}`}
                      >
                        <Link
                          to="/admin/quizzes/$quizId"
                          params={{ quizId: String(quiz.id) }}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => setPendingDelete(quiz)}
                        aria-label={`Delete ${quiz.title}`}
                        data-ocid={`quiz.delete_button.${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog. Mirrors PositionList's pattern. */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="quiz.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{pendingDelete?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.questionCount > 0 ? (
                <>
                  This quiz currently has{" "}
                  <strong>{pendingDelete.questionCount}</strong> question
                  {pendingDelete.questionCount === 1 ? "" : "s"} and all stored
                  attempts. Deleting it removes the quiz, its questions, and its
                  attempt history permanently.
                </>
              ) : (
                <>
                  This quiz has no questions yet. It will be removed
                  immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="quiz.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="quiz.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
