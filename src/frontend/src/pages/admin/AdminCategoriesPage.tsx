// Admin — Manage categories page. Header with create button, the CategoryList
// table (with item counts, sort-order controls, edit/delete), and the
// CategoryFormDialog for create / edit. Loading and empty states are handled
// by the list component itself.
//
// Sub-category management is wired through the same page: each category row
// can expand to reveal its SubCategoryList plus an "Add Sub-Category" button.
// A single SubCategoryFormDialog instance handles both create and edit flows
// for sub-categories, with the parent category id derived from the active
// (expanded / editing) category.

import type { CategoryId, CategoryPublic, SubCategoryPublic } from "@/backend";
import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { CategoryList } from "@/components/admin/CategoryList";
import { SubCategoryFormDialog } from "@/components/admin/SubCategoryFormDialog";
import { SubCategoryList } from "@/components/admin/SubCategoryList";
import { Button } from "@/components/ui/button";
import { useCategories, useSubCategories } from "@/hooks/useQueries";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

export function AdminCategoriesPage() {
  const { data, isLoading, isError, error } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryPublic | null>(null);

  // Sub-category dialog state. A single dialog instance is reused for both
  // create and edit. `subParentCategoryId` is the parent category for the
  // sub-category currently being created or edited.
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] =
    useState<SubCategoryPublic | null>(null);
  const [subParentCategoryId, setSubParentCategoryId] =
    useState<CategoryId | null>(null);

  // Expanded category rows (controlled by this page). Stored as string keys
  // so they survive CategoryId re-fetches and stay Set-friendly.
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    new Set(),
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: CategoryPublic) {
    setEditing(category);
    setDialogOpen(true);
  }

  function toggleSubCategories(category: CategoryPublic, expanded: boolean) {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (expanded) {
        next.add(String(category.id));
      } else {
        next.delete(String(category.id));
      }
      return next;
    });
  }

  function openCreateSubCategory(parentCategory: CategoryPublic) {
    setEditingSubCategory(null);
    setSubParentCategoryId(parentCategory.id);
    setSubDialogOpen(true);
  }

  function openEditSubCategory(
    parentCategory: CategoryPublic,
    subCategory: SubCategoryPublic,
  ) {
    setEditingSubCategory(subCategory);
    setSubParentCategoryId(parentCategory.id);
    setSubDialogOpen(true);
  }

  // Render prop for the expanded sub-category panel below a category row.
  // Fetches the sub-categories for that parent and renders the SubCategoryList
  // plus an "Add Sub-Category" button. The edit action routes back into the
  // shared SubCategoryFormDialog in edit mode.
  function renderSubCategories(category: CategoryPublic) {
    return (
      <SubCategoryPanel
        category={category}
        onAddSubCategory={() => openCreateSubCategory(category)}
        onEditSubCategory={(sub) => openEditSubCategory(category, sub)}
      />
    );
  }

  // Resolve the parent display name for the sub-category dialog context.
  const subParentName =
    data?.find((c) => c.id === subParentCategoryId)?.name ?? undefined;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, reorder, and delete the menu categories shown on your
            storefront.
          </p>
        </div>
        <Button onClick={openCreate} data-ocid="category.create_button">
          <Plus className="size-4" /> New category
        </Button>
      </header>

      {/* Body */}
      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-20"
          data-ocid="category.loading_state"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center"
          data-ocid="category.error_state"
        >
          <p className="font-medium text-destructive">
            Could not load categories
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            data-ocid="category.retry_button"
          >
            Retry
          </Button>
        </div>
      ) : (
        <CategoryList
          categories={data ?? []}
          onEdit={openEdit}
          onToggleSubCategories={toggleSubCategories}
          renderSubCategories={renderSubCategories}
          expandedCategoryIds={expandedCategoryIds}
        />
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />

      {/* Single shared sub-category dialog (create + edit). The parent
          category id is required to open it; we guard against the null case
          so the dialog never renders without a valid parent context. */}
      {subParentCategoryId !== null && (
        <SubCategoryFormDialog
          open={subDialogOpen}
          onOpenChange={setSubDialogOpen}
          parentCategoryId={subParentCategoryId}
          parentCategoryName={subParentName}
          subCategory={editingSubCategory}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-category panel — rendered inside an expanded category row       */
/* ------------------------------------------------------------------ */

interface SubCategoryPanelProps {
  category: CategoryPublic;
  onAddSubCategory: () => void;
  onEditSubCategory: (sub: SubCategoryPublic) => void;
}

function SubCategoryPanel({
  category,
  onAddSubCategory,
  onEditSubCategory,
}: SubCategoryPanelProps) {
  const { data: subCategories = [], isLoading } = useSubCategories(category.id);

  return (
    <div
      className="flex flex-col gap-3 py-2"
      data-ocid={`category.subcategories_panel.${String(category.id)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sub-categories under{" "}
          <span className="font-medium text-foreground">{category.name}</span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAddSubCategory}
          data-ocid={`subcategory.add_button.${String(category.id)}`}
        >
          <Plus className="size-4" /> Add Sub-Category
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-10"
          data-ocid={`subcategory.loading_state.${String(category.id)}`}
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SubCategoryList
          subCategories={subCategories}
          parentCategoryId={category.id}
          onEdit={onEditSubCategory}
        />
      )}
    </div>
  );
}
