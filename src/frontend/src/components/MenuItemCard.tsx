// MenuItemCard — photo-driven menu item tile for the category page grid.
// Square-ish dish photo with a cream card body holding the dish name and a
// short description preview. Whole card links to the recipe card view.

import { blobUrl } from "@/lib/blob";
import type { MenuItemPublic } from "@/types";
import { Link } from "@tanstack/react-router";

export function MenuItemCard({
  item,
  index,
}: {
  item: MenuItemPublic;
  index: number;
}) {
  const photoUrl = blobUrl(item.itemPhoto);

  return (
    <Link
      to="/item/$id"
      params={{ id: String(item.id) }}
      className="group block focus-visible:outline-none"
      data-ocid={`category.menu.item.${index + 1}`}
      aria-label={`View recipe for ${item.name}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth group-hover:-translate-y-1 group-hover:shadow-elevated group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={photoUrl}
            alt={item.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground line-clamp-1">
            {item.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
          <span className="mt-auto pt-2 text-xs font-medium uppercase tracking-wider text-primary">
            View recipe
          </span>
        </div>
      </article>
    </Link>
  );
}
