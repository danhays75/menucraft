// Position table — optional photo thumbnail, name, category count, sort-order
// controls (up/down buttons, NOT drag-and-drop), and edit / delete actions.
// Deleting a position with assigned categories is BLOCKED by the backend:
// deletePosition returns the count of blocking categories. When that count is
// > 0 we surface an AlertDialog explaining the position cannot be deleted until
// its categories are reassigned — we never silently succeed.
//
// This mirrors CategoryList but WITHOUT the expandable sub-category panel
// (positions do not have nested sub-entities in this build).

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
import { useDeletePosition, useSetPositionSortOrder } from "@/hooks/useQueries";
import type { PositionView } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface PositionListProps {
  positions: PositionView[];
  onEdit: (position: PositionView) => void;
}

export function PositionList({ positions, onEdit }: PositionListProps) {
  const deleteMut = useDeletePosition();
  const sortMut = useSetPositionSortOrder();

  // Sorted by sortOrder ascending for display.
  const sorted = [...positions].sort((a, b) => a.sortOrder - b.sortOrder);

  // The position the admin is currently confirming deletion for.
  const [pendingDelete, setPendingDelete] = useState<PositionView | null>(null);
  // When the backend refuses deletion (returns > 0 blocking categories), we
  // surface a separate "blocked" dialog explaining why. This is distinct from
  // the confirm dialog so the messaging stays clear.
  const [blockedDelete, setBlockedDelete] = useState<{
    position: PositionView;
    count: number;
  } | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      const blockingCount = await deleteMut.mutateAsync(
        BigInt(pendingDelete.id),
      );
      const blocked = Number(blockingCount);
      if (blocked > 0) {
        // Backend refused — categories still assigned. Show the blocked
        // dialog instead of a success toast.
        setBlockedDelete({ position: pendingDelete, count: blocked });
      } else {
        toast.success("Position deleted");
      }
    } catch (err) {
      toast.error("Could not delete position");
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
      // Swap sort orders between the two adjacent positions.
      await sortMut.mutateAsync({
        id: BigInt(a.id),
        sortOrder: BigInt(b.sortOrder),
      });
      await sortMut.mutateAsync({
        id: BigInt(b.id),
        sortOrder: BigInt(a.sortOrder),
      });
    } catch (err) {
      toast.error("Could not reorder position");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (sorted.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center"
        data-ocid="position.empty_state"
      >
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Briefcase className="size-5" />
        </div>
        <p className="font-display text-lg font-semibold">No positions yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first position to start grouping menu categories on the
          storefront.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table data-ocid="position.table">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Categories</TableHead>
              <TableHead className="w-32 text-center">Order</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((pos, index) => {
              const isFirst = index === 0;
              const isLast = index === sorted.length - 1;
              return (
                <TableRow
                  key={String(pos.id)}
                  data-ocid={`position.row.${index + 1}`}
                >
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="size-11 overflow-hidden rounded-md border border-border bg-muted/30">
                      {pos.coverUrl ? (
                        <img
                          src={pos.coverUrl}
                          alt={pos.name}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Briefcase className="size-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {pos.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      data-ocid={`position.category_count.${index + 1}`}
                    >
                      {pos.categoryCount}
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
                        aria-label={`Move ${pos.name} up`}
                        data-ocid={`position.move_up.${index + 1}`}
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
                        aria-label={`Move ${pos.name} down`}
                        data-ocid={`position.move_down.${index + 1}`}
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
                        onClick={() => onEdit(pos)}
                        aria-label={`Edit ${pos.name}`}
                        data-ocid={`position.edit_button.${index + 1}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => setPendingDelete(pos)}
                        aria-label={`Delete ${pos.name}`}
                        data-ocid={`position.delete_button.${index + 1}`}
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

      {/* Delete confirmation dialog. Mirrors CategoryList's pattern. */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="position.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && pendingDelete.categoryCount > 0 ? (
                <>
                  This position currently has{" "}
                  <strong>{pendingDelete.categoryCount}</strong> categor
                  {pendingDelete.categoryCount === 1 ? "y" : "ies"} assigned to
                  it. You must reassign or remove its categories before it can
                  be deleted.
                </>
              ) : (
                <>
                  This position has no categories assigned. It will be removed
                  from the storefront immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="position.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="position.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocked-deletion dialog. Shown when the backend refuses deletion
          because categories are still assigned. This is NOT a success — we
          explicitly tell the admin the position was not deleted. */}
      <AlertDialog
        open={!!blockedDelete}
        onOpenChange={(o) => !o && setBlockedDelete(null)}
      >
        <AlertDialogContent data-ocid="position.delete_blocked_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cannot delete “{blockedDelete?.position.name}”
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockedDelete && (
                <>
                  This position still has <strong>{blockedDelete.count}</strong>{" "}
                  categor
                  {blockedDelete.count === 1 ? "y" : "ies"} assigned to it.
                  Reassign or remove those categories first, then try again. The
                  position was not deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction data-ocid="position.delete_blocked_close_button">
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
