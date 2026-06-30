// Admin — Manage menu items page. Header with create button, a filter bar
// (category dropdown + sub-category dropdown + name search input), and the
// ItemList table.
//
// IMPORTANT: the backend's listItemsByCategory(categoryId) returns ONLY items
// placed directly under a category (subCategoryId == null). Items assigned to
// a sub-category are returned by listItemsBySubCategory(subCategoryId). To
// show a complete view of every menu item we therefore fetch, per category,
// the direct items AND each of that category's sub-category item lists, then
// merge them. Filtering by category / sub-category and searching by name all
// happen client-side on the merged list.

import { createActor } from "@/backend";
import type { MenuItemPublic } from "@/backend";
import { ItemFormDialog } from "@/components/admin/ItemFormDialog";
import { ItemList } from "@/components/admin/ItemList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories, useSubCategories } from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

const ALL = "__all__";
const SUB_ALL = "__sub_all__";
const SUB_NONE = "__sub_none__";

export function AdminItemsPage() {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { actor, isFetching } = useActor(createActor);

  // Aggregate items across every category in a single query. For each
  // category we fetch the direct-under-category items AND every sub-category's
  // items, then flatten. This is the only way to surface items that were
  // created with a non-null subCategoryId (listItemsByCategory filters those
  // out).
  const itemsQuery = useQuery<MenuItemPublic[]>({
    queryKey: ["items", "all"],
    queryFn: async () => {
      if (!actor || categories.length === 0) return [];
      const perCategory = await Promise.all(
        categories.map(async (c) => {
          const direct = await actor.listItemsByCategory(c.id);
          const subs = await actor.listSubCategories(c.id);
          const perSub = await Promise.all(
            subs.map((s) => actor.listItemsBySubCategory(s.id)),
          );
          return [...direct, ...perSub.flat()];
        }),
      );
      return perCategory.flat();
    },
    enabled: !!actor && !isFetching && categories.length > 0,
  });

  const [filterCategory, setFilterCategory] = useState<string>(ALL);
  const [filterSubCategory, setFilterSubCategory] = useState<string>(SUB_ALL);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemPublic | null>(null);

  // Sub-categories for the currently selected category. Only fetched when a
  // specific category is chosen (the sub-category filter is disabled when
  // "All categories" is selected).
  const selectedCategoryId =
    filterCategory === ALL ? undefined : BigInt(filterCategory);
  const { data: subCategories = [] } = useSubCategories(selectedCategoryId);

  const items = itemsQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        filterCategory === ALL || String(item.categoryId) === filterCategory;
      const matchesSubCategory =
        filterSubCategory === SUB_ALL ||
        (filterSubCategory === SUB_NONE
          ? item.subCategoryId === undefined
          : String(item.subCategoryId) === filterSubCategory);
      const matchesSearch =
        term.length === 0 ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);
      return matchesCategory && matchesSubCategory && matchesSearch;
    });
  }, [items, filterCategory, filterSubCategory, search]);

  function handleCategoryChange(value: string) {
    setFilterCategory(value);
    // Reset the sub-category filter whenever the category changes — the
    // previous sub-category id belongs to a different parent.
    setFilterSubCategory(SUB_ALL);
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(item: MenuItemPublic) {
    setEditing(item);
    setDialogOpen(true);
  }

  const isLoading = catsLoading || itemsQuery.isLoading;
  const subFilterDisabled = filterCategory === ALL;

  return (
    <div
      className="mx-auto flex max-w-5xl flex-col gap-6"
      data-ocid="admin.items.page"
    >
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Menu items
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Create, edit, and delete the dishes on your storefront. Filter by
            category or sub-category, or search by name.
          </p>
        </div>
        <Button onClick={openCreate} data-ocid="item.create_button">
          <Plus className="size-4" /> New item
        </Button>
      </header>

      {/* Filter bar */}
      <div
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
        data-ocid="item.filter_bar"
      >
        <div className="flex flex-col gap-1.5 sm:w-52">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Category
          </span>
          <Select value={filterCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger data-ocid="item.filter_category.select">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent data-ocid="item.filter_category.dropdown_menu">
              <SelectItem
                value={ALL}
                data-ocid="item.filter_category.option.all"
              >
                All categories
              </SelectItem>
              {categories.map((c, i) => (
                <SelectItem
                  key={String(c.id)}
                  value={String(c.id)}
                  data-ocid={`item.filter_category.option.${i + 1}`}
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:w-56">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sub-category
          </span>
          <Select
            value={subFilterDisabled ? SUB_ALL : filterSubCategory}
            onValueChange={setFilterSubCategory}
            disabled={subFilterDisabled}
          >
            <SelectTrigger data-ocid="item.filter_subcategory.select">
              <SelectValue placeholder="All sub-categories" />
            </SelectTrigger>
            <SelectContent data-ocid="item.filter_subcategory.dropdown_menu">
              <SelectItem
                value={SUB_ALL}
                data-ocid="item.filter_subcategory.option.all"
              >
                All sub-categories
              </SelectItem>
              <SelectItem
                value={SUB_NONE}
                data-ocid="item.filter_subcategory.option.none"
              >
                None / direct under category
              </SelectItem>
              {subCategories.map((s, i) => (
                <SelectItem
                  key={String(s.id)}
                  value={String(s.id)}
                  data-ocid={`item.filter_subcategory.option.${i + 1}`}
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Search
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder="Search by name or description"
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="item.search_input"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card py-20"
          data-ocid="item.loading_state"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : itemsQuery.isError ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center"
          data-ocid="item.error_state"
        >
          <p className="font-medium text-destructive">Could not load items</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Please try again later.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => itemsQuery.refetch()}
            data-ocid="item.retry_button"
          >
            Retry
          </Button>
        </div>
      ) : (
        <ItemList
          items={filtered}
          categories={categories}
          subCategories={subCategories}
          onEdit={openEdit}
        />
      )}

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
      />
    </div>
  );
}
