// Create / edit category dialog. Name field + PhotoUpload for the cover photo.
// Uses useCreateCategory for new categories and useUpdateCategory when an
// existing CategoryPublic is passed in for editing.

import type { CategoryPublic, ExternalBlob } from "@/backend";
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
import { useCreateCategory, useUpdateCategory } from "@/hooks/useQueries";
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

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);

  // Reset form whenever the dialog opens (or the target category changes).
  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setPhoto(category?.coverPhoto ?? null);
    setTouched(false);
  }, [open, category]);

  const nameError = touched && name.trim().length === 0;
  const photoError = touched && !photo;
  const canSubmit = name.trim().length > 0 && !!photo;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !photo) return;
    try {
      if (isEdit && category) {
        await updateMut.mutateAsync({
          id: category.id,
          name: name.trim(),
          coverPhoto: photo,
        });
        toast.success("Category updated");
      } else {
        await createMut.mutateAsync({
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
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name and cover photo for this category."
              : "Add a new menu category with a name and a cover photo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name" data-ocid="category.name.label">
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
