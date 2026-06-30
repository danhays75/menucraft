// CategoryPage — grid of SubCategoryCard tiles (when present) plus any direct
// MenuItemCard items for the selected category. Uses useSubCategories and
// useCategoryItems hooks. Shows EmptyState when neither exists. Public — no
// login required.

import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Layout";
import { MenuItemCard } from "@/components/MenuItemCard";
import { SubCategoryCard } from "@/components/SubCategoryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategory,
  useCategoryItems,
  useSubCategories,
} from "@/hooks/useQueries";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";

const GRID_CLASSES = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function CategoryPage() {
  const { id } = useParams({ from: "/storefront-layout/category/$id" });
  const categoryId = BigInt(id);

  const { data: category, isLoading: categoryLoading } =
    useCategory(categoryId);
  const { data: items, isLoading: itemsLoading } = useCategoryItems(categoryId);
  const { data: subcategories, isLoading: subsLoading } =
    useSubCategories(categoryId);

  const isLoading = categoryLoading || itemsLoading || subsLoading;
  const itemCount = items?.length ?? 0;
  const subCount = subcategories?.length ?? 0;

  const hasSubs = !subsLoading && (subcategories?.length ?? 0) > 0;
  const hasItems = !itemsLoading && (items?.length ?? 0) > 0;
  const showEmpty = !isLoading && !hasSubs && !hasItems;

  return (
    <>
      {/* Breadcrumb + header band */}
      <Section variant="muted" className="py-10 sm:py-12">
        <nav
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="category.breadcrumb_home"
          >
            <Link to="/" data-ocid="category.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Menu
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="font-medium text-foreground"
            data-ocid="category.breadcrumb_current"
          >
            {categoryLoading ? "Loading…" : (category?.name ?? "Category")}
          </span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <UtensilsCrossed className="size-3" /> Category
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {categoryLoading ? (
                <Skeleton
                  className="h-10 w-48"
                  data-ocid="category.title.loading_state"
                />
              ) : (
                (category?.name ?? "Category")
              )}
            </h1>
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading dishes…"
                : `${itemCount} ${itemCount === 1 ? "dish" : "dishes"}${subCount > 0 ? ` · ${subCount} ${subCount === 1 ? "sub-category" : "sub-categories"}` : ""}`}
            </p>
          </div>
        </div>
      </Section>

      {/* Sub-categories + items */}
      <Section className="py-16 sm:py-20">
        {isLoading ? (
          <div className="space-y-12">
            {/* Sub-category skeletons */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <div className={GRID_CLASSES}>
                {["sub-skel-1", "sub-skel-2", "sub-skel-3"].map((skel, i) => (
                  <Skeleton
                    key={skel}
                    className="aspect-[4/3] w-full rounded-xl"
                    data-ocid={`category.subcategory.loading_state.${i + 1}`}
                  />
                ))}
              </div>
            </div>
            {/* Item skeletons */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-32" />
              <div className={GRID_CLASSES}>
                {[
                  "skel-1",
                  "skel-2",
                  "skel-3",
                  "skel-4",
                  "skel-5",
                  "skel-6",
                ].map((skel, i) => (
                  <Skeleton
                    key={skel}
                    className="aspect-square w-full rounded-xl"
                    data-ocid={`category.menu.loading_state.${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : showEmpty ? (
          <EmptyState
            ocid="category.empty_state"
            title="No dishes in this category yet"
            description="This category doesn't have any menu items or sub-categories right now. Check back soon — the kitchen is always adding new recipes."
            backLabel="Back to all categories"
          />
        ) : (
          <div className="space-y-12">
            {/* Sub-categories section */}
            {hasSubs && subcategories ? (
              <section
                className="space-y-5"
                data-ocid="category.subcategory.section"
              >
                <div className="flex items-center gap-2.5">
                  <FolderTree className="size-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Sub-Categories
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {subCount} {subCount === 1 ? "collection" : "collections"}
                  </span>
                </div>
                <div className={GRID_CLASSES}>
                  {subcategories.map((sub, index) => (
                    <motion.div
                      key={String(sub.id)}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                        delay: index * 0.08,
                      }}
                    >
                      <SubCategoryCard subcategory={sub} index={index} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Direct items section */}
            {hasItems && items ? (
              <section className="space-y-5" data-ocid="category.menu.section">
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="size-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Items
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "dish" : "dishes"}
                  </span>
                </div>
                <div className={GRID_CLASSES}>
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
              </section>
            ) : null}
          </div>
        )}
      </Section>
    </>
  );
}
