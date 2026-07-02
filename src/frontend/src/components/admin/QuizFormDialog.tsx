// Create / edit quiz dialog. Title (required), optional description,
// passing percentage (1–100, required), and a Position selector (required —
// every quiz belongs to a position). Uses useCreateQuiz for new quizzes and
// useUpdateQuiz when an existing QuizPublic is passed in for editing.
//
// Mirrors CategoryFormDialog's Position Select pattern and PositionFormDialog's
// optional-description pattern. Passing percentage is a number input clamped
// to [1, 100]; the backend stores it as Nat, so we convert via BigInt.

import type { PositionId } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuiz, usePositions, useUpdateQuiz } from "@/hooks/useQueries";
import type { QuizPublic } from "@/types";
import { toPositionView } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this quiz; otherwise it creates one. */
  quiz?: QuizPublic | null;
}

const MIN_PERCENT = 1;
const MAX_PERCENT = 100;

export function QuizFormDialog({
  open,
  onOpenChange,
  quiz,
}: QuizFormDialogProps) {
  const isEdit = !!quiz;
  const createMut = useCreateQuiz();
  const updateMut = useUpdateQuiz();
  const { data: positions } = usePositions();

  // Sort positions by sortOrder (ascending) for a stable, predictable list.
  const sortedPositions = (positions ?? [])
    .map(toPositionView)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [positionId, setPositionId] = useState<PositionId | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [percent, setPercent] = useState<string>("80");
  const [touched, setTouched] = useState(false);

  // Default to the first position once the list has loaded. Computed outside
  // the effect so the dependency list stays simple and exhaustive.
  const defaultPositionId = sortedPositions[0]?.id ?? null;

  // Reset form whenever the dialog opens (or the target quiz changes).
  useEffect(() => {
    if (!open) return;
    setPositionId(quiz?.positionId ?? defaultPositionId);
    setTitle(quiz?.title ?? "");
    setDescription(quiz?.description ?? "");
    setPercent(quiz ? String(Number(quiz.passingPercentage)) : "80");
    setTouched(false);
  }, [open, quiz, defaultPositionId]);

  const positionError = touched && positionId === null;
  const titleError = touched && title.trim().length === 0;
  const parsedPercent = Number.parseInt(percent, 10);
  const percentError =
    touched &&
    (Number.isNaN(parsedPercent) ||
      parsedPercent < MIN_PERCENT ||
      parsedPercent > MAX_PERCENT);
  const canSubmit =
    positionId !== null &&
    title.trim().length > 0 &&
    !Number.isNaN(parsedPercent) &&
    parsedPercent >= MIN_PERCENT &&
    parsedPercent <= MAX_PERCENT;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || positionId === null) return;
    const trimmedDescription =
      description.trim().length > 0 ? description.trim() : null;
    try {
      if (isEdit && quiz) {
        await updateMut.mutateAsync({
          quizId: quiz.id,
          edit: {
            title: title.trim(),
            description: trimmedDescription ?? undefined,
            passingPercentage: BigInt(parsedPercent),
          },
        });
        toast.success("Quiz updated");
      } else {
        await createMut.mutateAsync({
          positionId,
          input: {
            title: title.trim(),
            description: trimmedDescription ?? undefined,
            passingPercentage: BigInt(parsedPercent),
          },
        });
        toast.success("Quiz created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? "Could not update quiz" : "Could not create quiz");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="quiz.dialog">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {isEdit ? "Edit quiz" : "New quiz"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the position, title, description, and passing percentage for this quiz."
              : "Create a quiz attached to a position. You can add questions next."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              className="font-heading uppercase tracking-wide"
              data-ocid="quiz.position.label"
            >
              Position
            </Label>
            <Select
              value={positionId !== null ? String(positionId) : undefined}
              onValueChange={(v) => setPositionId(BigInt(v))}
            >
              <SelectTrigger
                aria-invalid={positionError}
                data-ocid="quiz.position.select"
              >
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent data-ocid="quiz.position.dropdown_menu">
                {sortedPositions.map((p, i) => (
                  <SelectItem
                    key={String(p.id)}
                    value={String(p.id)}
                    data-ocid={`quiz.position.option.${i + 1}`}
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {positionError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz.position.field_error"
              >
                Please choose a position.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="quiz-title"
              className="font-heading uppercase tracking-wide"
              data-ocid="quiz.title.label"
            >
              Title
            </Label>
            <Input
              id="quiz-title"
              value={title}
              placeholder="e.g. Bartender Basics, Server Onboarding"
              autoFocus
              aria-invalid={titleError}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="quiz.title.input"
            />
            {titleError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz.title.field_error"
              >
                Title is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="quiz-description"
              className="font-heading uppercase tracking-wide"
              data-ocid="quiz.description.label"
            >
              Description{" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="quiz-description"
              value={description}
              placeholder="A short summary of what this quiz covers."
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              data-ocid="quiz.description.input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="quiz-percent"
              className="font-heading uppercase tracking-wide"
              data-ocid="quiz.percent.label"
            >
              Passing percentage{" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                ({MIN_PERCENT}–{MAX_PERCENT})
              </span>
            </Label>
            <Input
              id="quiz-percent"
              type="number"
              min={MIN_PERCENT}
              max={MAX_PERCENT}
              value={percent}
              aria-invalid={percentError}
              onChange={(e) => setPercent(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="quiz.percent.input"
            />
            {percentError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz.percent.field_error"
              >
                Enter a whole number between {MIN_PERCENT} and {MAX_PERCENT}.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="quiz.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="quiz.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
