// Item table — photo thumbnail, name, description, category badge, sub-category
// badge, and edit / delete actions. Used by AdminItemsPage. Deleting an item
// shows a confirmation AlertDialog. The list is purely presentational;
// filtering and search are handled by the parent page so this component
// receives the already filtered array.
//
// Sub-category display: items with a subCategoryId render a secondary badge
// showing the sub-category name (resolved from the subCategories prop). Items
// placed directly under a category (no subCategoryId) render an outline
// "Direct" badge so the admin can tell at a glance which items are not in any
// sub-category.

import type {
  CategoryPublic,
  MenuItemPublic,
  SubCategoryPublic,
} from "@/backend";
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
import { useDeleteMenuItem } from "@/hooks/useQueries";
import { blobUrl } from "@/lib/blob";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface ItemListProps {
  items: MenuItemPublic[];
  categories: CategoryPublic[];
  /** Sub-categories for the currently filtered category (empty when "All
   * categories" is selected). Used to resolve sub-category names for the
   * badge column. */
  subCategories?: SubCategoryPublic[];
  onEdit: (item: MenuItemPublic) => void;
}

export function ItemList({
  items,
  categories,
  subCategories = [],
  onEdit,
}: ItemListProps) {
  const deleteMut = useDeleteMenuItem();
  const [pendingDelete, setPendingDelete] = useState<MenuItemPublic | null>(
    null,
  );

  const categoryName = (categoryId: bigint): string =>
    categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized";

  const subCategoryName = (
    subCategoryId: bigint | undefined,
  ): string | null => {
    if (subCategoryId === undefined) return null;
    return subCategories.find((s) => s.id === subCategoryId)?.name ?? null;
  };

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync({
        id: pendingDelete.id,
        categoryId: pendingDelete.categoryId,
        subCategoryId: pendingDelete.subCategoryId ?? null,
      });
      toast.success("Menu item deleted");
    } catch (err) {
      toast.error("Could not delete menu item");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setPendingDelete(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
        data-ocid="item.empty_state"
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Pencil className="size-5" />
        </div>
        <p className="font-heading text-lg font-semibold uppercase tracking-wide">
          No menu items found
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try adjusting your search or category filter, or create a new menu
          item to add to your storefront.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table data-ocid="item.table">
          <TableHeader>
            <TableRow className="border-b-2 border-primary/50 bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-16 font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Photo
              </TableHead>
              <TableHead className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="hidden font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                Description
              </TableHead>
              <TableHead className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="hidden font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                Sub-category
              </TableHead>
              <TableHead className="w-28 text-right font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const subName = subCategoryName(item.subCategoryId);
              return (
                <TableRow
                  key={String(item.id)}
                  data-ocid={`item.row.${index + 1}`}
                >
                  <TableCell>
                    <div className="size-11 overflow-hidden rounded-md border border-border bg-muted/30">
                      <img
                        src={blobUrl(item.itemPhoto)}
                        alt={item.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.name}
                  </TableCell>
                  <TableCell className="hidden max-w-sm md:table-cell">
                    <p className="truncate text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="border-accent/40 bg-accent/10 text-accent"
                      data-ocid={`item.category.${index + 1}`}
                    >
                      {categoryName(item.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {subName !== null ? (
                      <Badge
                        variant="secondary"
                        className="border-border bg-muted/40 text-foreground"
                        data-ocid={`item.subcategory.${index + 1}`}
                      >
                        {subName}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                        data-ocid={`item.subcategory.${index + 1}`}
                      >
                        Direct
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        data-ocid={`item.edit_button.${index + 1}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => setPendingDelete(item)}
                        aria-label={`Delete ${item.name}`}
                        data-ocid={`item.delete_button.${index + 1}`}
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
        <AlertDialogContent data-ocid="item.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the menu item, its recipe, and any
              training steps from the storefront. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="item.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="item.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
