// Admin — Manage positions page. Header with create button, the PositionList
// table (with category counts, sort-order controls, edit/delete), and the
// PositionFormDialog for create / edit. Loading and empty states are handled
// by the list component itself.
//
// This mirrors AdminCategoriesPage but WITHOUT the sub-category expansion
// panel — positions have no nested sub-entities in this build.

import type { PositionPublic } from "@/backend";
import { PositionFormDialog } from "@/components/admin/PositionFormDialog";
import { PositionList } from "@/components/admin/PositionList";
import { Button } from "@/components/ui/button";
import { usePositions } from "@/hooks/useQueries";
import { type PositionView, toPositionView } from "@/types";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

export function AdminPositionsPage() {
  const { data, isLoading, isError, error } = usePositions();
  const [dialogOpen, setDialogOpen] = useState(false);
  // The dialog edits a raw backend PositionPublic (it needs coverPhoto, not
  // coverUrl). The list works with PositionView. We keep both in sync by
  // looking the raw record up from `data` when the list asks to edit a view.
  const [editingId, setEditingId] = useState<bigint | null>(null);

  function openCreate() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(position: PositionView) {
    setEditingId(BigInt(position.id));
    setDialogOpen(true);
  }

  // Map backend PositionPublic rows into display-ready PositionView rows.
  const positions: PositionView[] = (data ?? []).map(toPositionView);
  const editing: PositionPublic | null =
    editingId !== null
      ? ((data ?? []).find((p) => p.id === editingId) ?? null)
      : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Positions
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, reorder, and delete the positions that group your menu
            categories on the storefront.
          </p>
        </div>
        <Button onClick={openCreate} data-ocid="position.create_button">
          <Plus className="size-4" /> New position
        </Button>
      </header>

      {/* Body */}
      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-20"
          data-ocid="position.loading_state"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center"
          data-ocid="position.error_state"
        >
          <p className="font-medium text-destructive">
            Could not load positions
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            data-ocid="position.retry_button"
          >
            Retry
          </Button>
        </div>
      ) : (
        <PositionList positions={positions} onEdit={openEdit} />
      )}

      <PositionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        position={editing}
      />
    </div>
  );
}

export default AdminPositionsPage;
