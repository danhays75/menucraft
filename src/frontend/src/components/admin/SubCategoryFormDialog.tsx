// Create / edit sub-category dialog. Name field + PhotoUpload for the cover
// photo. The parent category is fixed (passed in as a prop and shown as
// read-only context — NOT a Select). Uses useCreateSubCategory for new
// sub-categories and useUpdateSubCategory when an existing SubCategoryPublic
// is passed in for editing. Mirrors CategoryFormDialog structure exactly.

import type { CategoryId, ExternalBlob, SubCategoryPublic } from "@/backend";
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
import { useCreateSubCategory, useUpdateSubCategory } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface SubCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixed parent category — the sub-category is always created under it. */
  parentCategoryId: CategoryId;
  /** Optional parent display name shown as read-only context. */
  parentCategoryName?: string;
  /** When provided, the dialog edits this sub-category; otherwise it creates one. */
  subCategory?: SubCategoryPublic | null;
}

export function SubCategoryFormDialog({
  open,
  onOpenChange,
  parentCategoryId,
  parentCategoryName,
  subCategory,
}: SubCategoryFormDialogProps) {
  const isEdit = !!subCategory;
  const createMut = useCreateSubCategory();
  const updateMut = useUpdateSubCategory();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);

  // Reset form whenever the dialog opens (or the target sub-category changes).
  useEffect(() => {
    if (!open) return;
    setName(subCategory?.name ?? "");
    setPhoto(subCategory?.coverPhoto ?? null);
    setTouched(false);
  }, [open, subCategory]);

  const nameError = touched && name.trim().length === 0;
  const photoError = touched && !photo;
  const canSubmit = name.trim().length > 0 && !!photo;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !photo) return;
    try {
      if (isEdit && subCategory) {
        await updateMut.mutateAsync({
          id: subCategory.id,
          parentCategoryId,
          name: name.trim(),
          coverPhoto: photo,
        });
        toast.success("Sub-category updated");
      } else {
        await createMut.mutateAsync({
          parentCategoryId,
          name: name.trim(),
          coverPhoto: photo,
        });
        toast.success("Sub-category created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit
          ? "Could not update sub-category"
          : "Could not create sub-category",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="subcategory.dialog">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {isEdit ? "Edit sub-category" : "New sub-category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name and cover photo for this sub-category."
              : "Add a sub-category under a parent category with a name and a cover photo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Read-only parent category context (NOT a Select). */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="subcategory-parent"
              className="font-heading uppercase tracking-wide text-muted-foreground"
            >
              Parent category
            </Label>
            <div
              id="subcategory-parent"
              className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground"
              data-ocid="subcategory.parent.context"
            >
              {parentCategoryName ?? `Category #${parentCategoryId.toString()}`}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="subcategory-name"
              className="font-heading uppercase tracking-wide"
              data-ocid="subcategory.name.label"
            >
              Name
            </Label>
            <Input
              id="subcategory-name"
              value={name}
              placeholder="e.g. Hot starters, Cold drinks, Chef's specials"
              autoFocus
              aria-invalid={nameError}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="subcategory.name.input"
            />
            {nameError && (
              <p
                className="text-xs text-destructive"
                data-ocid="subcategory.name.field_error"
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
              hint="Shown on the storefront sub-category grid"
            />
            {photoError && (
              <p
                className="text-xs text-destructive"
                data-ocid="subcategory.photo.field_error"
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
              data-ocid="subcategory.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="subcategory.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create sub-category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
