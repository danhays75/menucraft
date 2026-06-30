// Create / edit menu item dialog. Fields: name, description, category
// (Select), and item photo (PhotoUpload). Uses useCreateMenuItem for new items
// and useUpdateMenuItem when an existing MenuItemPublic is passed for editing.
// The recipe (ingredients + instructions) and training steps are managed on
// the full edit screen, not in this dialog.

import type {
  CategoryId,
  ExternalBlob,
  MenuItemPublic,
  SubCategoryId,
} from "@/backend";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
import { SubCategorySelect } from "@/components/admin/SubCategorySelect";
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
import {
  useCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
} from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this item; otherwise it creates one. */
  item?: MenuItemPublic | null;
  /** Called with the new or updated item's id after a successful save. */
  onSaved?: (itemId: bigint) => void;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: ItemFormDialogProps) {
  const isEdit = !!item;
  const createMut = useCreateMenuItem();
  const updateMut = useUpdateMenuItem();
  const { data: categories } = useCategories();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<SubCategoryId | null>(
    null,
  );
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);

  // Reset form whenever the dialog opens (or the target item changes).
  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setCategoryId(item?.categoryId ?? categories?.[0]?.id ?? null);
    setSubCategoryId(item?.subCategoryId ?? null);
    setPhoto(item?.itemPhoto ?? null);
    setTouched(false);
  }, [open, item, categories]);

  // When the category changes (user picks a different one), reset the
  // sub-category selection to "None" so we never carry a stale sub-category
  // id that doesn't belong to the new parent category.
  function onCategoryChange(next: CategoryId) {
    setCategoryId(next);
    setSubCategoryId(null);
  }

  const nameError = touched && name.trim().length === 0;
  const categoryError = touched && categoryId === null;
  const photoError = touched && !photo;
  const canSubmit = name.trim().length > 0 && categoryId !== null && !!photo;
  const pending = createMut.isPending || updateMut.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit || !photo || categoryId === null) return;
    try {
      if (isEdit && item) {
        await updateMut.mutateAsync({
          id: item.id,
          categoryId,
          subCategoryId,
          name: name.trim(),
          description: description.trim(),
          itemPhoto: photo,
        });
        toast.success("Menu item updated");
        onSaved?.(item.id);
      } else {
        const newId = await createMut.mutateAsync({
          categoryId,
          subCategoryId,
          name: name.trim(),
          description: description.trim(),
          itemPhoto: photo,
        });
        toast.success("Menu item created");
        onSaved?.(newId);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? "Could not update menu item" : "Could not create menu item",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-ocid="item.dialog">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit menu item" : "New menu item"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the basic details for this dish. Recipe and training steps can be edited on the full edit screen."
              : "Add a new dish to your menu. You can add its recipe and training steps afterwards."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name" data-ocid="item.name.label">
              Name
            </Label>
            <Input
              id="item-name"
              value={name}
              placeholder="e.g. Margherita Pizza, Caesar Salad"
              autoFocus
              aria-invalid={nameError}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="item.name.input"
            />
            {nameError && (
              <p
                className="text-xs text-destructive"
                data-ocid="item.name.field_error"
              >
                Name is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="item-description"
              data-ocid="item.description.label"
            >
              Description
            </Label>
            <Textarea
              id="item-description"
              value={description}
              placeholder="A short, appetizing description shown on the storefront."
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              data-ocid="item.description.input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label data-ocid="item.category.label">Category</Label>
            <Select
              value={categoryId !== null ? String(categoryId) : undefined}
              onValueChange={(v) => onCategoryChange(BigInt(v))}
            >
              <SelectTrigger
                aria-invalid={categoryError}
                data-ocid="item.category.select"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent data-ocid="item.category.dropdown_menu">
                {(categories ?? []).map((c, i) => (
                  <SelectItem
                    key={String(c.id)}
                    value={String(c.id)}
                    data-ocid={`item.category.option.${i + 1}`}
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryError && (
              <p
                className="text-xs text-destructive"
                data-ocid="item.category.field_error"
              >
                Please choose a category.
              </p>
            )}
          </div>

          <SubCategorySelect
            categoryId={categoryId}
            value={subCategoryId}
            onChange={setSubCategoryId}
            ocidPrefix="item"
          />

          <div className="flex flex-col gap-2">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              label="Item photo"
              hint="Shown on the storefront item card"
            />
            {photoError && (
              <p
                className="text-xs text-destructive"
                data-ocid="item.photo.field_error"
              >
                An item photo is required.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="item.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="item.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
