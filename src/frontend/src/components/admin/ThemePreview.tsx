// ThemePreview — live preview panel showing how the in-progress theme will
// look: a sample heading in the chosen font, a primary and accent button, and
// a card with a logo lockup. The preview is scoped via inline CSS custom
// properties on the container so unsaved edits are reflected immediately
// without touching the global :root (the global application happens on save
// via the useThemeSettings hook).

import { FontChoice } from "@/backend";
import type { ExternalBlob } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { blobUrl } from "@/lib/blob";
import { ChefHat } from "lucide-react";
import type * as React from "react";

export interface ThemePreviewProps {
  primaryColor: string;
  accentColor: string;
  font: FontChoice;
  logo?: ExternalBlob | null;
  ocid: string;
}

const FONT_STACK: Record<FontChoice, string> = {
  [FontChoice.serif]: '"Fraunces", serif',
  [FontChoice.sansSerif]: '"DM Sans", sans-serif',
  [FontChoice.systemFont]: "system-ui, sans-serif",
  [FontChoice.monospace]: 'ui-monospace, "JetBrains Mono", monospace',
};

export function ThemePreview({
  primaryColor,
  accentColor,
  font,
  logo,
  ocid,
}: ThemePreviewProps) {
  // Scope the preview by overriding the CSS custom properties on the
  // container. Child elements that use bg-primary / bg-accent / font-display
  // tokens will pick up the overrides automatically.
  const style: React.CSSProperties = {
    // Inline oklch()/hex values are allowed here because they are user-supplied
    // theme overrides applied to a scoped preview container, not global styles.
    ["--primary" as string]: primaryColor,
    ["--accent" as string]: accentColor,
    ["--font-display" as string]: FONT_STACK[font],
  };

  const logoUrl = blobUrl(logo, "");

  return (
    <div
      data-ocid={ocid}
      style={style}
      className="rounded-xl border border-border bg-gradient-subtle p-6"
    >
      {/* Mock header lockup — logo (or fallback mark) + wordmark */}
      <div className="flex items-center gap-2.5 border-b border-border pb-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo preview"
            className="h-8 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChefHat className="size-4.5" />
          </span>
        )}
        <span className="font-display text-lg font-semibold tracking-tight">
          MenuCraft
        </span>
        <Badge variant="secondary" className="ml-auto">
          Preview
        </Badge>
      </div>

      {/* Sample content */}
      <div className="mt-5 flex flex-col gap-4">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            Roasted heirloom carrots
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A warm, photo-driven preview of how your storefront will read.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" data-ocid={`${ocid}.primary_button`}>
            Order now
          </Button>
          <Button
            size="sm"
            variant="outline"
            data-ocid={`${ocid}.secondary_button`}
          >
            View recipe
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <span className="size-1.5 rounded-full bg-accent" />
            Seasonal
          </span>
        </div>

        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ChefHat className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Kitchen training</p>
              <p className="text-xs text-muted-foreground">
                Step-by-step prep cards inherit your theme.
              </p>
            </div>
            <Badge className="bg-accent text-accent-foreground">3 steps</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
