// Shared sub-category selector used by the item create/edit forms. Renders a
// Select populated with the sub-categories of the given parent category, plus
// a leading "None (direct under category)" option. When the parent category
// has no sub-categories, the Select is disabled and a hint is shown.
//
// The component is controlled: the parent owns the `subCategoryId` state and
// is responsible for resetting it to null when the parent category changes.

import type { CategoryId, SubCategoryId } from "@/backend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubCategories } from "@/hooks/useQueries";
import { Loader2 } from "lucide-react";

export interface SubCategorySelectProps {
  categoryId: CategoryId | null;
  /** Currently selected sub-category id, or null for "None". */
  value: SubCategoryId | null;
  onChange: (value: SubCategoryId | null) => void;
  /** data-ocid prefix for the parent's marker namespace, e.g. "item" or "item_edit". */
  ocidPrefix: string;
  /** Whether the sub-categories query is still loading (rare; usually instant). */
  disabled?: boolean;
}

const NONE = "__none__";

export function SubCategorySelect({
  categoryId,
  value,
  onChange,
  ocidPrefix,
  disabled,
}: SubCategorySelectProps) {
  const { data: subCategories = [], isLoading } = useSubCategories(
    categoryId ?? undefined,
  );

  const hasSubs = subCategories.length > 0;
  const selectValue = value !== null ? String(value) : NONE;
  const isDisabled = !!disabled || !hasSubs || categoryId === null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label ocidPrefix={ocidPrefix} />
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === NONE ? null : BigInt(v))}
        disabled={isDisabled}
      >
        <SelectTrigger
          data-ocid={`${ocidPrefix}.subcategory.select`}
          aria-label="Sub-category"
        >
          <SelectValue placeholder="None (direct under category)" />
        </SelectTrigger>
        <SelectContent data-ocid={`${ocidPrefix}.subcategory.dropdown_menu`}>
          <SelectItem
            value={NONE}
            data-ocid={`${ocidPrefix}.subcategory.option.none`}
          >
            None (direct under category)
          </SelectItem>
          {subCategories.map((s, i) => (
            <SelectItem
              key={String(s.id)}
              value={String(s.id)}
              data-ocid={`${ocidPrefix}.subcategory.option.${i + 1}`}
            >
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <p
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          data-ocid={`${ocidPrefix}.subcategory.loading_state`}
        >
          <Loader2 className="size-3 animate-spin" /> Loading sub-categories…
        </p>
      )}
      {!isLoading && !hasSubs && categoryId !== null && (
        <p
          className="text-xs text-muted-foreground"
          data-ocid={`${ocidPrefix}.subcategory.empty_state`}
        >
          No sub-categories for this category.
        </p>
      )}
    </div>
  );
}

function Label({ ocidPrefix }: { ocidPrefix: string }) {
  return (
    <span
      className="text-sm font-medium leading-none"
      data-ocid={`${ocidPrefix}.subcategory.label`}
    >
      Sub-category
    </span>
  );
}
