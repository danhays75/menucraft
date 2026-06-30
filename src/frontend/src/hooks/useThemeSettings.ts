// Theme hook — fetches the admin-configured theme from the backend and applies
// it to :root as CSS custom properties so the whole app (storefront + admin)
// re-themes instantly. Falls back to the design-system defaults when the
// backend returns nulls.

import { FontChoice, type ThemePublic, createActor } from "@/backend";
import { blobUrl } from "@/lib/blob";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const FONT_MAP: Record<FontChoice, string> = {
  [FontChoice.serif]: '"Fraunces", serif',
  [FontChoice.sansSerif]: '"DM Sans", sans-serif',
  [FontChoice.monospace]: 'ui-monospace, "JetBrains Mono", monospace',
  [FontChoice.systemFont]: "system-ui, sans-serif",
};

// The backend stores colors as hex (#RRGGBB), but tailwind.config.js maps the
// primary/accent tokens as oklch(var(--primary) / <alpha-value>). For that
// wrapper to produce valid CSS, the CSS variable must hold bare OKLCH
// components (lightness chroma hue, space-separated) — NOT a hex string.
// This converts a hex color to those bare components.
function hexToOklchComponents(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  let r = ((n >> 16) & 0xff) / 255;
  let g = ((n >> 8) & 0xff) / 255;
  let b = (n & 0xff) / 255;

  // sRGB -> linear RGB
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  r = lin(r);
  g = lin(g);
  b = lin(b);

  // Linear RGB -> LMS (OKLab intermediate)
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m__ = Math.cbrt(m_);
  const s_ = Math.cbrt(s);

  // LMS -> OKLab
  const L = 0.2104542553 * l_ + 0.793617785 * m__ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m__ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m__ - 0.808675766 * s_;

  // OKLab -> OKLCH
  const C = Math.sqrt(a * a + b_ * b_);
  let H = (Math.atan2(b_, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(0)}`;
}

function applyTheme(theme: ThemePublic): void {
  const root = document.documentElement;
  if (theme.primaryColor) {
    const oklch = hexToOklchComponents(theme.primaryColor);
    if (oklch) root.style.setProperty("--primary", oklch);
  }
  if (theme.accentColor) {
    const oklch = hexToOklchComponents(theme.accentColor);
    if (oklch) root.style.setProperty("--accent", oklch);
  }
  if (theme.font)
    root.style.setProperty("--font-display", FONT_MAP[theme.font]);
  // Logo is applied via a data attribute consumed by the Layout header.
  const logoUrl = blobUrl(theme.logo);
  root.setAttribute("data-logo-url", logoUrl);
}

function clearTheme(): void {
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--font-display");
  root.removeAttribute("data-logo-url");
}

export function useThemeSettings() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const query = useQuery<ThemePublic>({
    queryKey: ["theme"],
    queryFn: async () => {
      if (!actor) throw new Error("actor not ready");
      return actor.getTheme();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Apply theme whenever it changes.
  if (query.data) {
    applyTheme(query.data);
  }

  return {
    theme: query.data ?? null,
    isLoading: query.isLoading,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["theme"] }),
    reset: clearTheme,
  };
}
