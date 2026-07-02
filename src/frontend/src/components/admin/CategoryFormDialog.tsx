// Create / edit category dialog. Position Select + name field + PhotoUpload
// for the cover photo. Uses useCreateCategory for new categories and
// useUpdateCategory when an existing CategoryPublic is passed in for editing.
// A category must belong to a position, so the Position Select is required.

import type { CategoryPublic, ExternalBlob, PositionId } from "@/backend";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateCategory,
  usePositions,
  useUpdateCategory,
} from "@/hooks/useQueries";
import { toPositionView } from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this category; otherwise it creates one. */
  category?: CategoryPublic | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const isEdit = !!category;
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const { data: positions } = usePositions();

  // Sort positions by sortOrder (ascending) for a stable, predictable list.
  const sortedPositions = (positions ?? [])
    .map(toPositionView)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [positionId, setPositionId] = useState<PositionId | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);

  // Default to the first position once the list has loaded. Computed outside
  // the effect so the dependency list stays simple and exhaustive.
  const defaultPositionId = sortedPositions[0]?.id ?? null;

  // Reset form whenever the dialog opens (or the target category changes).
  useEffect(() => {
    if (!open) return;
    setPositionId(category?.positionId ?? defaultPositionId);
    setName(category?.name ?? "");
    setPhoto(category?.coverPhoto ?? null);
    setTouched(false);
  }, [open, category, defaultPositionId]);

  const positionError = touched && positionId === null;
  const nameError = touched && name.trim().length === 0;
  const photoError = touched && !photo;
  const canSubmit = positionId !== null && name.trim().length > 0 && !!photo;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !photo || positionId === null) return;
    try {
      if (isEdit && category) {
        await updateMut.mutateAsync({
          id: category.id,
          positionId,
          name: name.trim(),
          coverPhoto: photo,
        });
        toast.success("Category updated");
      } else {
        await createMut.mutateAsync({
          positionId,
          name: name.trim(),
          coverPhoto: photo,
        });
        toast.success("Category created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? "Could not update category" : "Could not create category",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="category.dialog">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {isEdit ? "Edit category" : "New category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the position, name, and cover photo for this category."
              : "Add a new menu category under a position, with a name and a cover photo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              className="font-heading uppercase tracking-wide"
              data-ocid="category.position.label"
            >
              Position
            </Label>
            <Select
              value={positionId !== null ? String(positionId) : undefined}
              onValueChange={(v) => setPositionId(BigInt(v))}
            >
              <SelectTrigger
                aria-invalid={positionError}
                data-ocid="category.position.select"
              >
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent data-ocid="category.position.dropdown_menu">
                {sortedPositions.map((p, i) => (
                  <SelectItem
                    key={String(p.id)}
                    value={String(p.id)}
                    data-ocid={`category.position.option.${i + 1}`}
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {positionError && (
              <p
                className="text-xs text-destructive"
                data-ocid="category.position.field_error"
              >
                Please choose a position.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="category-name"
              className="font-heading uppercase tracking-wide"
              data-ocid="category.name.label"
            >
              Name
            </Label>
            <Input
              id="category-name"
              value={name}
              placeholder="e.g. Starters, Mains, Desserts"
              autoFocus
              aria-invalid={nameError}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="category.name.input"
            />
            {nameError && (
              <p
                className="text-xs text-destructive"
                data-ocid="category.name.field_error"
              >
                Name is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              label="Cover photo"
              hint="Shown on the storefront category grid"
            />
            {photoError && (
              <p
                className="text-xs text-destructive"
                data-ocid="category.photo.field_error"
              >
                A cover photo is required.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="category.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="category.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
