// Sub-category table — photo thumbnail, name, item count, sort-order controls
// (up/down buttons, NOT drag-and-drop), and edit / delete actions. Mirrors
// CategoryList structure. Deleting a sub-category shows a confirmation
// AlertDialog warning the admin that its items will be reassigned back to
// direct-under-category (the parent category).

import type { CategoryId, SubCategoryPublic } from "@/backend";
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
import {
  useDeleteSubCategory,
  useSetSubCategorySortOrder,
} from "@/hooks/useQueries";
import { blobUrl } from "@/lib/blob";
import { ArrowDown, ArrowUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface SubCategoryListProps {
  subCategories: SubCategoryPublic[];
  parentCategoryId: CategoryId;
  onEdit: (subCategory: SubCategoryPublic) => void;
}

export function SubCategoryList({
  subCategories,
  parentCategoryId,
  onEdit,
}: SubCategoryListProps) {
  const deleteMut = useDeleteSubCategory();
  const sortMut = useSetSubCategorySortOrder();

  // Sorted by sortOrder ascending for display.
  const sorted = [...subCategories].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  );

  const [pendingDelete, setPendingDelete] = useState<SubCategoryPublic | null>(
    null,
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync({
        id: pendingDelete.id,
        parentCategoryId,
      });
      toast.success("Sub-category deleted");
    } catch (err) {
      toast.error("Could not delete sub-category");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setPendingDelete(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    try {
      // Swap sort orders between the two adjacent sub-categories.
      await sortMut.mutateAsync({
        id: a.id,
        parentCategoryId,
        sortOrder: b.sortOrder,
      });
      await sortMut.mutateAsync({
        id: b.id,
        parentCategoryId,
        sortOrder: a.sortOrder,
      });
    } catch (err) {
      toast.error("Could not reorder sub-category");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
        data-ocid="subcategory.empty_state"
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Pencil className="size-5" />
        </div>
        <p className="font-display text-base font-semibold">
          No sub-categories yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add a sub-category to organize items within this category more
          granularly on the storefront.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table data-ocid="subcategory.table">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-14">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="w-32 text-center">Order</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((sub, index) => {
              const itemCount = Number(sub.itemCount);
              const isFirst = index === 0;
              const isLast = index === sorted.length - 1;
              return (
                <TableRow
                  key={String(sub.id)}
                  data-ocid={`subcategory.row.${index + 1}`}
                >
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="size-10 overflow-hidden rounded-md border border-border bg-muted/30">
                      <img
                        src={blobUrl(sub.coverPhoto)}
                        alt={sub.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {sub.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      data-ocid={`subcategory.item_count.${index + 1}`}
                    >
                      {itemCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isFirst || sortMut.isPending}
                        onClick={() => move(index, -1)}
                        aria-label={`Move ${sub.name} up`}
                        data-ocid={`subcategory.move_up.${index + 1}`}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isLast || sortMut.isPending}
                        onClick={() => move(index, 1)}
                        aria-label={`Move ${sub.name} down`}
                        data-ocid={`subcategory.move_down.${index + 1}`}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit(sub)}
                        aria-label={`Edit ${sub.name}`}
                        data-ocid={`subcategory.edit_button.${index + 1}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => setPendingDelete(sub)}
                        aria-label={`Delete ${sub.name}`}
                        data-ocid={`subcategory.delete_button.${index + 1}`}
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

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="subcategory.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && Number(pendingDelete.itemCount) > 0 ? (
                <>
                  This sub-category currently has{" "}
                  <strong>{Number(pendingDelete.itemCount)}</strong> menu item
                  {Number(pendingDelete.itemCount) === 1 ? "" : "s"} assigned to
                  it. Deleting it will reassign those items back to direct-under
                  the parent category — they will no longer be grouped under
                  this sub-category on the storefront.
                </>
              ) : (
                <>
                  This sub-category has no menu items assigned. It will be
                  removed from the storefront immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="subcategory.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="subcategory.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete sub-category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
