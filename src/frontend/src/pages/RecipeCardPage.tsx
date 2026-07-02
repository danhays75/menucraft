// RecipeCardPage — wraps the RecipeCard component for a single menu item.
// Uses useMenuItem hook. Shows a loading skeleton while fetching and a
// not-found state if the item id is invalid. Public — no login required.

import { Section } from "@/components/Layout";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuItem } from "@/hooks/useQueries";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Soup } from "lucide-react";

export function RecipeCardPage() {
  const { id } = useParams({ from: "/storefront-layout/item/$id" });
  const itemId = BigInt(id);

  const { data: item, isLoading } = useMenuItem(itemId);

  return (
    <>
      {/* Breadcrumb band */}
      <Section variant="muted" className="py-8 sm:py-10">
        <nav
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="recipe.breadcrumb_home"
          >
            <Link to="/" data-ocid="recipe.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Menu
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="font-medium text-foreground"
            data-ocid="recipe.breadcrumb_current"
          >
            {isLoading ? "Loading…" : (item?.name ?? "Recipe")}
          </span>
        </nav>
      </Section>

      {/* Recipe card */}
      <Section className="py-12 sm:py-16">
        {isLoading ? (
          <div
            className="mx-auto max-w-3xl space-y-6"
            data-ocid="recipe.loading_state"
          >
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid gap-8 md:grid-cols-2">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        ) : item ? (
          <div className="mx-auto max-w-3xl">
            <RecipeCard item={item} />
          </div>
        ) : (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
            data-ocid="recipe.not_found.empty_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
              <Soup className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide">
                Recipe not found
              </h2>
              <p className="text-sm text-muted-foreground">
                We couldn't find that dish. It may have been removed from the
                menu.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              data-ocid="recipe.not_found.back_button"
            >
              <Link to="/" data-ocid="recipe.not_found.back_link">
                Back to menu
              </Link>
            </Button>
          </div>
        )}
      </Section>
    </>
  );
}
