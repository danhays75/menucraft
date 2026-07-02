// Create / edit position dialog. Name field (required), optional description
// field, and an OPTIONAL PhotoUpload for the cover photo. Unlike
// CategoryFormDialog, the cover photo is NOT required — a position can be
// saved with a name alone. Uses useCreatePosition for new positions and
// useUpdatePosition when an existing PositionPublic is passed in for editing.

import type { ExternalBlob, PositionPublic } from "@/backend";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreatePosition, useUpdatePosition } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this position; otherwise it creates one. */
  position?: PositionPublic | null;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
}: PositionFormDialogProps) {
  const isEdit = !!position;
  const createMut = useCreatePosition();
  const updateMut = useUpdatePosition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);

  // Reset form whenever the dialog opens (or the target position changes).
  useEffect(() => {
    if (!open) return;
    setName(position?.name ?? "");
    setDescription(position?.description ?? "");
    setPhoto(position?.coverPhoto ?? null);
    setTouched(false);
  }, [open, position]);

  const nameError = touched && name.trim().length === 0;
  // Cover photo is OPTIONAL for positions — no photoError, no photo gate.
  const canSubmit = name.trim().length > 0;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    const trimmedDescription =
      description.trim().length > 0 ? description.trim() : null;
    try {
      if (isEdit && position) {
        await updateMut.mutateAsync({
          id: position.id,
          name: name.trim(),
          description: trimmedDescription,
          coverPhoto: photo,
        });
        toast.success("Position updated");
      } else {
        await createMut.mutateAsync({
          name: name.trim(),
          description: trimmedDescription,
          coverPhoto: photo,
        });
        toast.success("Position created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? "Could not update position" : "Could not create position",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="position.dialog">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {isEdit ? "Edit position" : "New position"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name, description, and cover photo for this position."
              : "Add a new position to group your menu categories."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="position-name"
              className="font-heading uppercase tracking-wide"
              data-ocid="position.name.label"
            >
              Name
            </Label>
            <Input
              id="position-name"
              value={name}
              placeholder="e.g. Bartender, Line Cook, Server"
              autoFocus
              aria-invalid={nameError}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="position.name.input"
            />
            {nameError && (
              <p
                className="text-xs text-destructive"
                data-ocid="position.name.field_error"
              >
                Name is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="position-description"
              className="font-heading uppercase tracking-wide"
              data-ocid="position.description.label"
            >
              Description{" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="position-description"
              value={description}
              placeholder="A short summary of this role and its responsibilities."
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              data-ocid="position.description.input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              label="Cover photo (optional)"
              hint="Shown on the storefront position grid — leave blank to skip."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="position.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="position.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
