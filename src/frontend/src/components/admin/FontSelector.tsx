// FontSelector — dropdown for choosing the app's display font from the
// FontChoice variants. Each option carries a descriptive label and a small
// preview rendered in the target font so the admin can see the difference
// before saving.

import { FontChoice } from "@/backend";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FontSelectorProps {
  value: FontChoice;
  onChange: (font: FontChoice) => void;
  ocid: string;
}

interface FontOption {
  value: FontChoice;
  label: string;
  description: string;
  stack: string;
}

const OPTIONS: FontOption[] = [
  {
    value: FontChoice.sansSerif,
    label: "Anton / Oswald / Barlow",
    description: "Anton — bold condensed athletic display.",
    stack: '"Anton", "Oswald", "Barlow", sans-serif',
  },
  {
    value: FontChoice.serif,
    label: "Oswald / Barlow",
    description: "Oswald — strong condensed headings.",
    stack: '"Oswald", "Barlow", sans-serif',
  },
  {
    value: FontChoice.systemFont,
    label: "System UI",
    description: "Native OS font — fastest, no download.",
    stack: "system-ui, sans-serif",
  },
  {
    value: FontChoice.monospace,
    label: "Monospace",
    description: "Barlow — clean readable body. Fixed-width fallback.",
    stack: 'ui-monospace, "JetBrains Mono", monospace',
  },
];

export function FontSelector({ value, onChange, ocid }: FontSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={ocid}>Display font</Label>
      <Select value={value} onValueChange={(v) => onChange(v as FontChoice)}>
        <SelectTrigger id={ocid} className="w-full" data-ocid={ocid}>
          <SelectValue placeholder="Choose a font" />
        </SelectTrigger>
        <SelectContent data-ocid={`${ocid}.dropdown_menu`}>
          {OPTIONS.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              data-ocid={`${ocid}.option.${opt.value}`}
            >
              <span className="flex flex-col gap-0.5 py-0.5">
                <span
                  style={{ fontFamily: opt.stack }}
                  className="text-sm font-medium"
                >
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Applies to headings throughout the storefront and admin.
      </p>
    </div>
  );
}
