// EmptyState — friendly empty-state block used when a category has no items
// yet. Dark roadhouse styling: dashed dark border, gold icon badge, Oswald
// headline, Barlow supporting copy, and a back-to-menu CTA.

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
      className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center"
      data-ocid={ocid}
    >
      <div className="flex size-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
        <Soup className="size-7" />
      </div>
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide">
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
