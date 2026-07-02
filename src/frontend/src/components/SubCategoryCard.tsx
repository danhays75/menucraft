// SubCategoryCard — photo-driven sub-category tile for the category page grid.
// Mirrors CategoryCard: cover photo fills a 4/3 aspect card, a dark footer
// body holds the Oswald name and a gold item-count badge. No terracotta bar.
// Links to the sub-category detail route under the parent category.

import { blobUrl } from "@/lib/blob";
import type { SubCategoryPublic } from "@/types";
import { Link } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";

export function SubCategoryCard({
  subcategory,
  index,
}: {
  subcategory: SubCategoryPublic;
  index: number;
}) {
  const coverUrl = blobUrl(subcategory.coverPhoto);
  const count = Number(subcategory.itemCount);

  return (
    <Link
      to="/category/$id/sub/$subId"
      params={{
        id: String(subcategory.parentCategoryId),
        subId: String(subcategory.id),
      }}
      className="group block focus-visible:outline-none"
      data-ocid={`category.subcategory.item.${index + 1}`}
      aria-label={`Browse ${subcategory.name} sub-category`}
    >
      <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-elevated group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={coverUrl}
            alt={subcategory.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>
        {/* Dark footer body with Oswald sub-category name + gold count badge */}
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3.5">
          <h3 className="font-heading text-lg font-semibold uppercase leading-tight tracking-wide text-foreground line-clamp-1">
            {subcategory.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <UtensilsCrossed className="size-3" />
            {count} {count === 1 ? "dish" : "dishes"}
          </span>
        </div>
      </article>
    </Link>
  );
}
