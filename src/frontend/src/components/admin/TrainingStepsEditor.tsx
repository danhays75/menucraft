// Training steps editor — list of training steps for a menu item with
// add / edit / delete / reorder (up/down buttons, NOT drag-and-drop). Each
// step has text + optional photo/video upload. Uses useAddTrainingStep,
// useUpdateTrainingStep, useDeleteTrainingStep, and useMoveTrainingStep.
// Steps are sorted by their `order` field ascending.

import type {
  ExternalBlob,
  ItemId,
  TrainingStepInput,
  TrainingStepPublic,
} from "@/backend";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddTrainingStep,
  useDeleteTrainingStep,
  useMoveTrainingStep,
  useTrainingSteps,
  useUpdateTrainingStep,
} from "@/hooks/useQueries";
import { blobUrl, fileToBlob } from "@/lib/blob";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface TrainingStepsEditorProps {
  itemId: ItemId;
}

export function TrainingStepsEditor({ itemId }: TrainingStepsEditorProps) {
  const { data: steps = [], isLoading } = useTrainingSteps(itemId);
  const addMut = useAddTrainingStep();
  const _updateMut = useUpdateTrainingStep();
  const deleteMut = useDeleteTrainingStep();
  const moveMut = useMoveTrainingStep();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingStepPublic | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrainingStepPublic | null>(
    null,
  );

  const sorted = [...steps].sort((a, b) => Number(a.order) - Number(b.order));

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(step: TrainingStepPublic) {
    setEditing(step);
    setDialogOpen(true);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const step = sorted[index];
    const targetOrder = sorted[target].order;
    try {
      await moveMut.mutateAsync({
        stepId: step.id,
        newOrder: targetOrder,
        itemId,
      });
    } catch (err) {
      toast.error("Could not reorder step");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync({ stepId: pendingDelete.id, itemId });
      toast.success("Training step deleted");
    } catch (err) {
      toast.error("Could not delete step");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="training.editor">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
            Training steps
          </h3>
          <span className="text-xs text-muted-foreground">
            {sorted.length} step{sorted.length === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openCreate}
          disabled={addMut.isPending}
          data-ocid="training.add_button"
        >
          <Plus className="size-4" /> Add step
        </Button>
      </header>

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-md border border-border bg-card py-10"
          data-ocid="training.loading_state"
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
          data-ocid="training.empty_state"
        >
          <p className="font-medium text-foreground">No training steps yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Build a step-by-step training flow for staff to learn this dish.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {sorted.map((step, index) => (
            <li
              key={String(step.id)}
              className="flex items-start gap-3 rounded-lg border border-border border-t-2 border-t-primary/40 bg-card p-4"
              data-ocid={`training.item.${index + 1}`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {step.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {step.photo && (
                    <div className="size-16 overflow-hidden rounded-md border border-border bg-muted/30">
                      <img
                        src={blobUrl(step.photo)}
                        alt={`Step ${index + 1} reference`}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {step.video && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      <Video className="size-3.5" /> Video attached
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === 0 || moveMut.isPending}
                  onClick={() => move(index, -1)}
                  aria-label="Move step up"
                  data-ocid={`training.move_up.${index + 1}`}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === sorted.length - 1 || moveMut.isPending}
                  onClick={() => move(index, 1)}
                  aria-label="Move step down"
                  data-ocid={`training.move_down.${index + 1}`}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => openEdit(step)}
                  aria-label="Edit step"
                  data-ocid={`training.edit_button.${index + 1}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => setPendingDelete(step)}
                  aria-label="Delete step"
                  data-ocid={`training.delete_button.${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <TrainingStepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemId={itemId}
        step={editing}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="training.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this training step?</AlertDialogTitle>
            <AlertDialogDescription>
              The step will be removed from the training flow. Remaining steps
              will keep their relative order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="training.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="training.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete step
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step create / edit dialog                                            */
/* ------------------------------------------------------------------ */

interface StepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: ItemId;
  step: TrainingStepPublic | null;
}

function TrainingStepDialog({
  open,
  onOpenChange,
  itemId,
  step,
}: StepDialogProps) {
  const isEdit = !!step;
  const addMut = useAddTrainingStep();
  const updateMut = useUpdateTrainingStep();

  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [video, setVideo] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setText(step?.text ?? "");
    setPhoto(step?.photo ?? null);
    setVideo(step?.video ?? null);
    setTouched(false);
  }, [open, step]);

  const textError = touched && text.trim().length === 0;
  const canSubmit = text.trim().length > 0;
  const pending = addMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    try {
      if (isEdit && step) {
        await updateMut.mutateAsync({
          stepId: step.id,
          itemId,
          edit: {
            text: text.trim(),
            photo: photo ?? undefined,
            video: video ?? undefined,
          },
        });
        toast.success("Training step updated");
      } else {
        const input: TrainingStepInput = {
          text: text.trim(),
          photo: photo ?? undefined,
          video: video ?? undefined,
        };
        await addMut.mutateAsync({ itemId, input });
        toast.success("Training step added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(isEdit ? "Could not update step" : "Could not add step");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function onVideoChange(file: File | null) {
    if (!file) {
      setVideo(null);
      return;
    }
    try {
      const blob = await fileToBlob(file);
      setVideo(blob);
    } catch (err) {
      toast.error("Could not read video file");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="training.dialog">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit training step" : "New training step"}
          </DialogTitle>
          <DialogDescription>
            Add the instruction text and an optional photo or video to guide
            staff through this step.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="step-text" data-ocid="training.text.label">
              Instruction
            </Label>
            <Textarea
              id="step-text"
              value={text}
              placeholder="Describe what the staff member should do at this step."
              rows={4}
              autoFocus
              aria-invalid={textError}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="training.text.input"
            />
            {textError && (
              <p
                className="text-xs text-destructive"
                data-ocid="training.text.field_error"
              >
                Instruction text is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              label="Step photo (optional)"
              hint="A reference photo for this step"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label data-ocid="training.video.label">
              Step video (optional)
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                data-ocid="training.video.upload_button"
              >
                <Video className="size-4" />
                {video ? "Replace video" : "Choose video"}
              </Button>
              {video && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVideo(null)}
                  data-ocid="training.video.clear_button"
                >
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void onVideoChange(file);
                e.target.value = "";
              }}
              data-ocid="training.video.input"
            />
            <p className="text-xs text-muted-foreground">
              MP4 or WebM — up to ~50 MB
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="training.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="training.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add step"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
