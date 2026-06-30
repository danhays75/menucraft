// ColorPicker — paired HTML color input + hex text field with on-blur
// validation. Used by the theme page for primary and accent colors. The
// native swatch gives instant feedback; the text field allows precise hex
// entry. Invalid hex is surfaced inline and prevents the value from
// propagating until corrected.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export interface ColorPickerProps {
  /** Field label, e.g. "Primary color". */
  label: string;
  /** Current hex value (controlled). May be empty string when unset. */
  value: string;
  /** Called with the new hex string (lowercased, with leading #) on commit. */
  onChange: (hex: string) => void;
  /** Hint shown under the field. */
  hint?: string;
  /** Deterministic marker id for the field group. */
  ocid: string;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  // Expand 3-digit shorthand to 6-digit so the native color input accepts it.
  if (/^#[0-9a-fA-F]{3}$/.test(withHash) && withHash.length === 4) {
    const [, a, b, c] = withHash;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return withHash.toLowerCase();
}

export function ColorPicker({
  label,
  value,
  onChange,
  hint,
  ocid,
}: ColorPickerProps) {
  const [text, setText] = useState(value);
  const [touched, setTouched] = useState(false);

  // Keep the text field in sync when the controlled value changes externally
  // (e.g. reset to defaults, or the initial backend value arrives).
  useEffect(() => {
    setText(value);
  }, [value]);

  const normalized = normalizeHex(text);
  const isValid = text === "" || HEX_RE.test(normalized);
  const showError = touched && !isValid;

  function commit(next: string) {
    const norm = normalizeHex(next);
    if (HEX_RE.test(norm)) {
      onChange(norm);
    }
  }

  function onTextBlur() {
    setTouched(true);
    commit(text);
  }

  function onSwatchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value.toLowerCase();
    setText(hex);
    setTouched(false);
    onChange(hex);
  }

  // The native color input requires a 6-digit hex; fall back to a neutral
  // swatch when the value is empty or invalid so the control stays usable.
  const swatchValue = HEX_RE.test(normalized) ? normalized : "#8a8a8a";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${ocid}.input`}>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-md border border-input bg-muted/30">
          <input
            type="color"
            value={swatchValue}
            onChange={onSwatchChange}
            aria-label={`${label} swatch`}
            data-ocid={`${ocid}.swatch`}
            className="absolute -inset-1 size-[calc(100%+0.5rem)] cursor-pointer border-0 bg-transparent p-0"
          />
        </span>
        <Input
          id={`${ocid}.input`}
          type="text"
          value={text}
          placeholder="#8a5a3b"
          onChange={(e) => setText(e.target.value)}
          onBlur={onTextBlur}
          aria-invalid={showError || undefined}
          data-ocid={`${ocid}.input`}
          className="font-mono uppercase"
        />
      </div>
      {showError ? (
        <p
          className="text-xs text-destructive"
          data-ocid={`${ocid}.field_error`}
        >
          Enter a valid hex color, e.g. #8a5a3b or #8a5.
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
