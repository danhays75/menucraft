// AdminThemePage — full theme & branding control. The admin sets primary and
// accent colors, chooses a display font, and uploads a logo. A live preview
// reflects unsaved edits instantly. Save commits colors+font via
// useUpdateTheme and the logo via useUpdateLogo; Reset calls useResetTheme to
// restore platform defaults. Because the useThemeSettings hook applies the
// committed theme to :root app-wide, saved changes propagate to the
// storefront and admin immediately.

import { FontChoice } from "@/backend";
import type { ExternalBlob } from "@/backend";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { FontSelector } from "@/components/admin/FontSelector";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { ThemePreview } from "@/components/admin/ThemePreview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useResetTheme,
  useUpdateLogo,
  useUpdateTheme,
} from "@/hooks/useQueries";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { Loader2, Palette, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Platform defaults — must match the backend's reset values exactly. The
// backend stores colors as hex (#RRGGBB) and validates that format, so the
// reset constants must be hex too. useThemeSettings converts hex to OKLCH
// components before writing to the CSS variables.
const DEFAULT_PRIMARY = "#E4002B";
const DEFAULT_ACCENT = "#F2A900";
const DEFAULT_FONT = FontChoice.sansSerif;

export function AdminThemePage() {
  const { theme, isLoading } = useThemeSettings();
  const updateTheme = useUpdateTheme();
  const updateLogo = useUpdateLogo();
  const resetTheme = useResetTheme();

  // Local form state — seeded from the backend theme, edited by the admin,
  // committed on Save. Keeping it local lets the live preview show unsaved
  // edits without round-tripping to the canister on every keystroke.
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [font, setFont] = useState<FontChoice>(DEFAULT_FONT);
  const [logo, setLogo] = useState<ExternalBlob | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Seed local state once the backend theme arrives.
  useEffect(() => {
    if (seeded || isLoading || !theme) return;
    setPrimary(theme.primaryColor || DEFAULT_PRIMARY);
    setAccent(theme.accentColor || DEFAULT_ACCENT);
    setFont(theme.font || DEFAULT_FONT);
    setLogo(theme.logo ?? null);
    setSeeded(true);
  }, [theme, isLoading, seeded]);

  const dirty =
    primary !== (theme?.primaryColor || DEFAULT_PRIMARY) ||
    accent !== (theme?.accentColor || DEFAULT_ACCENT) ||
    font !== (theme?.font || DEFAULT_FONT) ||
    logo !== (theme?.logo ?? null);

  const saving = updateTheme.isPending || updateLogo.isPending;
  const resetting = resetTheme.isPending;

  async function handleSave() {
    try {
      // Commit colors + font first, then logo. Both invalidate the theme
      // query, so useThemeSettings re-applies :root globally.
      await updateTheme.mutateAsync({
        primaryColor: primary,
        accentColor: accent,
        font,
      });
      await updateLogo.mutateAsync(logo);
      toast.success("Theme saved", {
        description: "Storefront and admin now use the new look.",
      });
    } catch (err) {
      toast.error("Could not save theme", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  async function handleReset() {
    try {
      await resetTheme.mutateAsync();
      // Reflect the reset defaults locally so the preview stays in sync.
      setPrimary(DEFAULT_PRIMARY);
      setAccent(DEFAULT_ACCENT);
      setFont(DEFAULT_FONT);
      setLogo(null);
      toast.success("Theme reset", {
        description: "Platform defaults restored everywhere.",
      });
    } catch (err) {
      toast.error("Could not reset theme", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="admin.theme.loading_state"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-5xl flex-col gap-6"
      data-ocid="admin.theme.page"
    >
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Theme &amp; branding
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Customize the colors, font, and logo for your storefront and admin.
            Changes apply instantly everywhere once saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting || saving}
            data-ocid="admin.theme.reset_button"
          >
            <RotateCcw className="size-4" />
            {resetting ? "Resetting…" : "Reset to defaults"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            data-ocid="admin.theme.save_button"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
        </div>
      </header>

      {/* Body — two columns on large screens: controls + live preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Controls */}
        <Card className="bg-card" data-ocid="admin.theme.controls">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Pick the colors and font that define your brand.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ColorPicker
              label="Primary color"
              value={primary}
              onChange={setPrimary}
              hint="Used for buttons, links, and active states."
              ocid="admin.theme.primary"
            />
            <ColorPicker
              label="Accent color"
              value={accent}
              onChange={setAccent}
              hint="Used for highlights, badges, and secondary accents."
              ocid="admin.theme.accent"
            />
            <Separator />
            <FontSelector
              value={font}
              onChange={setFont}
              ocid="admin.theme.font"
            />
            <Separator />
            <LogoUpload
              value={logo}
              onChange={setLogo}
              ocid="admin.theme.logo"
            />
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Live preview
            </h2>
            {dirty ? (
              <span
                className="text-xs text-muted-foreground"
                data-ocid="admin.theme.dirty_state"
              >
                Unsaved changes
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                In sync with storefront
              </span>
            )}
          </div>
          <ThemePreview
            primaryColor={primary}
            accentColor={accent}
            font={font}
            logo={logo}
            ocid="admin.theme.preview"
          />
        </div>
      </div>
    </div>
  );
}
