// Category table — photo thumbnail, name, item count, sort-order controls
// (up/down buttons, NOT drag-and-drop), and edit / delete actions. Deleting a
// category with assigned menu items shows a confirmation AlertDialog warning
// the admin about the impact.

import type { CategoryPublic } from "@/backend";
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
import { useDeleteCategory, useSetCategorySortOrder } from "@/hooks/useQueries";
import { blobUrl } from "@/lib/blob";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export interface CategoryListProps {
  categories: CategoryPublic[];
  onEdit: (category: CategoryPublic) => void;
  /**
   * Optional. When provided, each row shows a "Manage sub-categories" expand
   * button that toggles an inline panel. Backward-compatible — omitting it
   * keeps the original table behavior.
   */
  onToggleSubCategories?: (category: CategoryPublic, expanded: boolean) => void;
  /** Optional render prop for the expanded sub-category panel below a row. */
  renderSubCategories?: (category: CategoryPublic) => React.ReactNode;
  /** Optional set of expanded category ids (controlled by parent). */
  expandedCategoryIds?: Set<string>;
}

export function CategoryList({
  categories,
  onEdit,
  onToggleSubCategories,
  renderSubCategories,
  expandedCategoryIds,
}: CategoryListProps) {
  const hasSubCategorySupport =
    !!onToggleSubCategories && !!renderSubCategories;
  const deleteMut = useDeleteCategory();
  const sortMut = useSetCategorySortOrder();

  // Sorted by sortOrder ascending for display.
  const sorted = [...categories].sort(
    (a, b) => Number(a.sortOrder) - Number(b.sortOrder),
  );

  const [pendingDelete, setPendingDelete] = useState<CategoryPublic | null>(
    null,
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success("Category deleted");
    } catch (err) {
      toast.error("Could not delete category");
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
      // Swap sort orders between the two adjacent categories.
      await sortMut.mutateAsync({ id: a.id, sortOrder: b.sortOrder });
      await sortMut.mutateAsync({ id: b.id, sortOrder: a.sortOrder });
    } catch (err) {
      toast.error("Could not reorder category");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
        data-ocid="category.empty_state"
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Pencil className="size-5" />
        </div>
        <p className="font-display text-lg font-semibold">No categories yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first menu category to start organizing dishes on the
          storefront.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table data-ocid="category.table">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="w-32 text-center">Order</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
              {hasSubCategorySupport && (
                <TableHead className="w-44 text-right">
                  Sub-categories
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((cat, index) => {
              const itemCount = Number(cat.itemCount);
              const isFirst = index === 0;
              const isLast = index === sorted.length - 1;
              const isExpanded = hasSubCategorySupport
                ? !!expandedCategoryIds?.has(String(cat.id))
                : false;
              return (
                <React.Fragment key={String(cat.id)}>
                  <TableRow data-ocid={`category.row.${index + 1}`}>
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="size-11 overflow-hidden rounded-md border border-border bg-muted/30">
                        <img
                          src={blobUrl(cat.coverPhoto)}
                          alt={cat.name}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        data-ocid={`category.item_count.${index + 1}`}
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
                          aria-label={`Move ${cat.name} up`}
                          data-ocid={`category.move_up.${index + 1}`}
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
                          aria-label={`Move ${cat.name} down`}
                          data-ocid={`category.move_down.${index + 1}`}
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
                          onClick={() => onEdit(cat)}
                          aria-label={`Edit ${cat.name}`}
                          data-ocid={`category.edit_button.${index + 1}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteMut.isPending}
                          onClick={() => setPendingDelete(cat)}
                          aria-label={`Delete ${cat.name}`}
                          data-ocid={`category.delete_button.${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                    {hasSubCategorySupport && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onToggleSubCategories?.(cat, !isExpanded)
                          }
                          aria-expanded={isExpanded}
                          aria-label={`Manage sub-categories for ${cat.name}`}
                          data-ocid={`category.manage_subcategories.${index + 1}`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                          {isExpanded ? "Collapse" : "Sub-categories"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                  {hasSubCategorySupport && isExpanded && (
                    <TableRow
                      className="bg-muted/20 hover:bg-muted/20"
                      data-ocid={`category.subcategories_panel.${index + 1}`}
                    >
                      <TableCell colSpan={hasSubCategorySupport ? 7 : 6}>
                        {renderSubCategories?.(cat)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="category.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && Number(pendingDelete.itemCount) > 0 ? (
                <>
                  This category currently has{" "}
                  <strong>{Number(pendingDelete.itemCount)}</strong> menu item
                  {Number(pendingDelete.itemCount) === 1 ? "" : "s"} assigned to
                  it. Deleting the category will remove it from the storefront —
                  please reassign or review its items first.
                </>
              ) : (
                <>
                  This category has no menu items assigned. It will be removed
                  from the storefront immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="category.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="category.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
