// EmptyState — friendly empty-state block used when a category has no items
// yet. Illustration glyph + headline + supporting copy + a back-to-menu CTA.

import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Soup } from "lucide-react";

export function EmptyState({
  title = "No dishes yet",
  description = "This category doesn't have any menu items right now. Check back soon — the kitchen is always adding new recipes.",
  backLabel = "Back to all categories",
  ocid = "category.empty_state",
}: {
  title?: string;
  description?: string;
  backLabel?: string;
  ocid?: string;
}) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
      data-ocid={ocid}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Soup className="size-7" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline" data-ocid={`${ocid}.back_button`}>
        <Link to="/" data-ocid={`${ocid}.back_link`}>
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
