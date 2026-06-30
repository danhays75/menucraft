// SubCategoryPage — grid of MenuItemCard components for the selected
// sub-category. Mirrors CategoryPage: breadcrumb Home > Category > Sub-Category,
// loading skeletons, and an EmptyState when the sub-category has no items.
// Public — no login required.

import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Layout";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategory,
  useItemsBySubCategory,
  useSubCategories,
} from "@/hooks/useQueries";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";

export function SubCategoryPage() {
  const { id, subId } = useParams({
    from: "/storefront-layout/category/$id/sub/$subId",
  });
  const categoryId = BigInt(id);
  const subCategoryId = BigInt(subId);

  const { data: category, isLoading: categoryLoading } =
    useCategory(categoryId);
  const { data: subCategories, isLoading: subsLoading } =
    useSubCategories(categoryId);
  const { data: items, isLoading: itemsLoading } =
    useItemsBySubCategory(subCategoryId);

  const isLoading = categoryLoading || subsLoading || itemsLoading;
  const subCategory = subCategories?.find((s) => s.id === subCategoryId);
  const subCategoryName = subCategory?.name ?? "Sub-category";
  const itemCount = items?.length ?? 0;

  return (
    <>
      {/* Breadcrumb + header band */}
      <Section variant="muted" className="py-10 sm:py-12">
        <nav
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="subcategory.breadcrumb_home"
          >
            <Link to="/" data-ocid="subcategory.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Menu
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="subcategory.breadcrumb_category"
          >
            <Link
              to="/category/$id"
              params={{ id }}
              data-ocid="subcategory.breadcrumb_category_link"
            >
              {categoryLoading ? "Loading…" : (category?.name ?? "Category")}
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="font-medium text-foreground"
            data-ocid="subcategory.breadcrumb_current"
          >
            {subsLoading ? "Loading…" : subCategoryName}
          </span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <UtensilsCrossed className="size-3" /> Sub-category
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {subsLoading ? (
                <Skeleton
                  className="h-10 w-56"
                  data-ocid="subcategory.title.loading_state"
                />
              ) : (
                subCategoryName
              )}
            </h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading dishes…"
                : `${itemCount} ${itemCount === 1 ? "dish" : "dishes"} in this sub-category`}
            </p>
          </div>
        </div>
      </Section>

      {/* Items grid */}
      <Section className="py-16 sm:py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {["skel-1", "skel-2", "skel-3", "skel-4", "skel-5", "skel-6"].map(
              (skel, i) => (
                <Skeleton
                  key={skel}
                  className="aspect-square w-full rounded-xl"
                  data-ocid={`subcategory.menu.loading_state.${i + 1}`}
                />
              ),
            )}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <motion.div
                key={String(item.id)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: index * 0.08,
                }}
              >
                <MenuItemCard item={item} index={index} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            ocid="subcategory.empty_state"
            title="No dishes in this sub-category yet"
            description="This sub-category doesn't have any menu items right now. Check back soon — the kitchen is always adding new recipes."
            backLabel={`Back to ${category?.name ?? "category"}`}
          />
        )}
      </Section>
    </>
  );
}
