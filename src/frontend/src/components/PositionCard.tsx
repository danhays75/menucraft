// PositionCard — photo-driven position tile for the storefront grid.
// Mirrors CategoryCard's visual pattern: optional cover photo, terracotta
// footer bar with serif name and category count, links to /position/$id.
// Cover photo is OPTIONAL — when absent, a tasteful Briefcase placeholder
// tile renders in its place, matching the warm kitchen editorial theme.

import type { PositionView } from "@/types";
import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

export function PositionCard({
  position,
  index,
}: {
  position: PositionView;
  index: number;
}) {
  const count = position.categoryCount;
  const hasCover = position.coverUrl && position.coverUrl.length > 0;
  const initial = position.name.trim().charAt(0).toUpperCase();

  return (
    <Link
      to="/position/$id"
      params={{ id: String(position.id) }}
      className="group block focus-visible:outline-none"
      data-ocid={`home.position.item.${index + 1}`}
      aria-label={`Browse ${position.name} position`}
    >
      <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth group-hover:-translate-y-1 group-hover:shadow-elevated group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {hasCover ? (
            <img
              src={position.coverUrl}
              alt={position.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            // Tasteful placeholder tile for positions without a cover photo.
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-smooth group-hover:scale-105">
                {initial ? (
                  <span className="font-display text-3xl font-semibold">
                    {initial}
                  </span>
                ) : (
                  <Briefcase className="size-9" />
                )}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
        </div>
        {/* Terracotta footer bar with serif position name */}
        <div className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-1">
            {position.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium">
            <Briefcase className="size-3" />
            {count} {count === 1 ? "category" : "categories"}
          </span>
        </div>
      </article>
    </Link>
  );
}
