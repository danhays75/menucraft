// Admin — Menu item edit page. Full edit screen for a single menu item with
// three tabs: Details (basic info + item photo via ItemFormDialog-style fields),
// Recipe (ingredients + instructions via RecipeEditor), and Training (training
// steps via TrainingStepsEditor). A "Preview" button opens a read-only preview
// dialog showing the recipe card and training flow as staff would see them.
//
// Route: /admin/items/$id (wired in the check wave). The page reads the item
// id from the route params.

import type { CategoryId, ExternalBlob, SubCategoryId } from "@/backend";
import { PhotoUpload } from "@/components/admin/PhotoUpload";
import { RecipeEditor } from "@/components/admin/RecipeEditor";
import { SubCategorySelect } from "@/components/admin/SubCategorySelect";
import { TrainingStepsEditor } from "@/components/admin/TrainingStepsEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategories,
  useMenuItem,
  useTrainingSteps,
  useUpdateMenuItem,
} from "@/hooks/useQueries";
import { blobUrl } from "@/lib/blob";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  GraduationCap,
  Loader2,
  Package,
  Save,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AdminItemEditPage() {
  const { id } = useParams({ from: "/admin-layout/admin/items/$id" });
  const itemId = BigInt(id);
  const navigate = useNavigate();

  const { data: item, isLoading: itemLoading } = useMenuItem(itemId);
  const { data: categories = [] } = useCategories();
  const updateMut = useUpdateMenuItem();

  const [tab, setTab] = useState("details");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Details form state.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<SubCategoryId | null>(
    null,
  );
  const [photo, setPhoto] = useState<ExternalBlob | null>(null);
  const [touched, setTouched] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate details form once the item loads.
  if (item && !hydrated) {
    setName(item.name);
    setDescription(item.description);
    setCategoryId(item.categoryId);
    setSubCategoryId(item.subCategoryId ?? null);
    setPhoto(item.itemPhoto);
    setHydrated(true);
  }

  // When the category changes, reset the sub-category to "None" so we never
  // submit a stale sub-category id that doesn't belong to the new parent.
  function onCategoryChange(next: CategoryId) {
    setCategoryId(next);
    setSubCategoryId(null);
  }

  const nameError = touched && name.trim().length === 0;
  const categoryError = touched && categoryId === null;
  const photoError = touched && !photo;
  const canSave = name.trim().length > 0 && categoryId !== null && !!photo;
  const detailsDirty =
    !!item &&
    (item.name !== name.trim() ||
      item.description !== description.trim() ||
      item.categoryId !== categoryId ||
      (item.subCategoryId ?? null) !== subCategoryId ||
      // Conservative: treat any photo change as dirty.
      photo !== item.itemPhoto);

  async function saveDetails() {
    setTouched(true);
    if (!canSave || !photo || categoryId === null || !item) return;
    try {
      await updateMut.mutateAsync({
        id: item.id,
        categoryId,
        subCategoryId,
        name: name.trim(),
        description: description.trim(),
        itemPhoto: photo,
      });
      toast.success("Item details saved");
    } catch (err) {
      toast.error("Could not save item details");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (itemLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="item_edit.loading_state"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-24 text-center"
        data-ocid="item_edit.error_state"
      >
        <p className="font-display text-lg font-semibold">Item not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This menu item may have been deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/admin/items" })}
          data-ocid="item_edit.back_button"
        >
          <ArrowLeft className="size-4" /> Back to items
        </Button>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-6"
      data-ocid="item_edit.page"
    >
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/items" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            data-ocid="item_edit.back_link"
          >
            <ArrowLeft className="size-3.5" /> All items
          </button>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {item.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit the details, recipe, and training flow for this menu item.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          data-ocid="item_edit.preview_button"
        >
          <Eye className="size-4" /> Preview
        </Button>
      </header>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} data-ocid="item_edit.tabs">
        <TabsList data-ocid="item_edit.tabs_list">
          <TabsTrigger value="details" data-ocid="item_edit.tab.details">
            <Package className="size-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="recipe" data-ocid="item_edit.tab.recipe">
            <UtensilsCrossed className="size-4" /> Recipe
          </TabsTrigger>
          <TabsTrigger value="training" data-ocid="item_edit.tab.training">
            <GraduationCap className="size-4" /> Training
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent
          value="details"
          className="rounded-lg border border-border bg-card p-6"
          data-ocid="item_edit.details.panel"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name" data-ocid="item_edit.name.label">
                Name
              </Label>
              <Input
                id="edit-name"
                value={name}
                aria-invalid={nameError}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                data-ocid="item_edit.name.input"
              />
              {nameError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="item_edit.name.field_error"
                >
                  Name is required.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="edit-description"
                data-ocid="item_edit.description.label"
              >
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                data-ocid="item_edit.description.input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label data-ocid="item_edit.category.label">Category</Label>
              <Select
                value={categoryId !== null ? String(categoryId) : undefined}
                onValueChange={(v) => onCategoryChange(BigInt(v))}
              >
                <SelectTrigger
                  aria-invalid={categoryError}
                  data-ocid="item_edit.category.select"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent data-ocid="item_edit.category.dropdown_menu">
                  {categories.map((c, i) => (
                    <SelectItem
                      key={String(c.id)}
                      value={String(c.id)}
                      data-ocid={`item_edit.category.option.${i + 1}`}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoryError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="item_edit.category.field_error"
                >
                  Please choose a category.
                </p>
              )}
            </div>

            <SubCategorySelect
              categoryId={categoryId}
              value={subCategoryId}
              onChange={setSubCategoryId}
              ocidPrefix="item_edit"
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
                  data-ocid="item_edit.photo.field_error"
                >
                  An item photo is required.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              {detailsDirty && (
                <span className="text-xs text-muted-foreground">
                  Unsaved changes
                </span>
              )}
              <Button
                type="button"
                onClick={saveDetails}
                disabled={updateMut.isPending || !detailsDirty}
                data-ocid="item_edit.save_button"
              >
                {updateMut.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                <Save className="size-4" /> Save details
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Recipe tab */}
        <TabsContent
          value="recipe"
          className="rounded-lg border border-border bg-card p-6"
          data-ocid="item_edit.recipe.panel"
        >
          <RecipeEditor
            itemId={itemId}
            ingredients={item.ingredients}
            instructions={item.instructions}
          />
        </TabsContent>

        {/* Training tab */}
        <TabsContent
          value="training"
          className="rounded-lg border border-border bg-card p-6"
          data-ocid="item_edit.training.panel"
        >
          <TrainingStepsEditor itemId={itemId} />
        </TabsContent>
      </Tabs>

      {/* Preview dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        itemId={itemId}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview dialog — recipe card + training flow as staff see them       */
/* ------------------------------------------------------------------ */

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: bigint;
}

function PreviewDialog({ open, onOpenChange, itemId }: PreviewDialogProps) {
  const { data: item } = useMenuItem(itemId);
  const { data: categories = [] } = useCategories();
  const { data: steps = [] } = useTrainingSteps(itemId);

  const categoryName =
    item && categories.find((c) => c.id === item.categoryId)?.name;

  const sortedSteps = [...steps].sort(
    (a, b) => Number(a.order) - Number(b.order),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
        data-ocid="item_edit.preview.dialog"
      >
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>
            How staff and customers will see this menu item.
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="flex flex-col gap-6">
            {/* Recipe card */}
            <article
              className="flex flex-col gap-4"
              data-ocid="item_edit.preview.recipe_card"
            >
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="aspect-video w-full overflow-hidden bg-muted/30">
                  <img
                    src={blobUrl(item.itemPhoto)}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold">
                      {item.name}
                    </h3>
                    {categoryName && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        {categoryName}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <section
                  className="rounded-lg border border-border bg-muted/20 p-4"
                  data-ocid="item_edit.preview.ingredients"
                >
                  <h4 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Ingredients
                  </h4>
                  {item.ingredients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No ingredients listed.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {item.ingredients.map((ing, i) => (
                        <li
                          key={ing}
                          className="flex gap-2"
                          data-ocid={`item_edit.preview.ingredient.${i + 1}`}
                        >
                          <span className="text-muted-foreground">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section
                  className="rounded-lg border border-border bg-muted/20 p-4"
                  data-ocid="item_edit.preview.instructions"
                >
                  <h4 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Instructions
                  </h4>
                  {item.instructions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No instructions listed.
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-2 text-sm">
                      {item.instructions.map((ins, i) => (
                        <li
                          key={ins}
                          className="flex gap-2"
                          data-ocid={`item_edit.preview.instruction.${i + 1}`}
                        >
                          <span className="font-semibold text-primary">
                            {i + 1}.
                          </span>
                          <span>{ins}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </article>

            {/* Training flow */}
            <section
              className="flex flex-col gap-3"
              data-ocid="item_edit.preview.training"
            >
              <h3 className="font-display text-base font-semibold">
                Training flow
              </h3>
              {sortedSteps.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  No training steps defined yet.
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {sortedSteps.map((step, i) => (
                    <li
                      key={String(step.id)}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                      data-ocid={`item_edit.preview.step.${i + 1}`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-sm text-foreground">
                          {step.text}
                        </p>
                        {step.photo && (
                          <div className="mt-3 size-20 overflow-hidden rounded-md border border-border bg-muted/30">
                            <img
                              src={blobUrl(step.photo)}
                              alt={`Step ${i + 1}`}
                              className="size-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-10"
            data-ocid="item_edit.preview.loading_state"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="item_edit.preview.close_button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
