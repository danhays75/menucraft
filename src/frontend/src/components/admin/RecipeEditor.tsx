// Recipe editor — editable ingredients list and instructions list for a menu
// item. Each list supports add / remove / reorder (up/down buttons, NOT
// drag-and-drop). Saves via useUpdateMenuItemRecipe. The parent passes the
// item id and the current ingredients / instructions arrays; this component
// holds local draft state and persists on explicit "Save recipe" click.

import type { ItemId } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateMenuItemRecipe } from "@/hooks/useQueries";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface RecipeEditorProps {
  itemId: ItemId;
  ingredients: string[];
  instructions: string[];
}

export function RecipeEditor({
  itemId,
  ingredients,
  instructions,
}: RecipeEditorProps) {
  const mut = useUpdateMenuItemRecipe();
  const [ing, setIng] = useState<string[]>([]);
  const [ins, setIns] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Re-sync local draft when the upstream arrays change (e.g. after a refetch).
  useEffect(() => {
    setIng(ingredients);
    setIns(instructions);
    setDirty(false);
  }, [ingredients, instructions]);

  function updateIng(index: number, value: string) {
    setIng((prev) => prev.map((v, i) => (i === index ? value : v)));
    setDirty(true);
  }
  function addIng() {
    setIng((prev) => [...prev, ""]);
    setDirty(true);
  }
  function removeIng(index: number) {
    setIng((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }
  function moveIng(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ing.length) return;
    setIng((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function updateIns(index: number, value: string) {
    setIns((prev) => prev.map((v, i) => (i === index ? value : v)));
    setDirty(true);
  }
  function addIns() {
    setIns((prev) => [...prev, ""]);
    setDirty(true);
  }
  function removeIns(index: number) {
    setIns((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }
  function moveIns(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ins.length) return;
    setIns((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  async function save() {
    const cleanIng = ing.map((s) => s.trim()).filter((s) => s.length > 0);
    const cleanIns = ins.map((s) => s.trim()).filter((s) => s.length > 0);
    try {
      await mut.mutateAsync({
        id: itemId,
        ingredients: cleanIng,
        instructions: cleanIns,
      });
      setIng(cleanIng);
      setIns(cleanIns);
      setDirty(false);
      toast.success("Recipe saved");
    } catch (err) {
      toast.error("Could not save recipe");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-8" data-ocid="recipe.editor">
      {/* Ingredients */}
      <section
        className="flex flex-col gap-3 border-t-2 border-t-primary/40 pt-4"
        data-ocid="recipe.ingredients.section"
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="size-4 text-primary" />
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Ingredients
            </h3>
            <span className="text-xs text-muted-foreground">
              {ing.length} item{ing.length === 1 ? "" : "s"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIng}
            data-ocid="recipe.ingredients.add_button"
          >
            <Plus className="size-4" /> Add ingredient
          </Button>
        </header>

        {ing.length === 0 ? (
          <p
            className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground"
            data-ocid="recipe.ingredients.empty_state"
          >
            No ingredients yet. Add the components that make up this dish.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ing.map((value, index) => (
              <li
                key={value}
                className="flex items-center gap-2"
                data-ocid={`recipe.ingredients.item.${index + 1}`}
              >
                <span className="w-6 shrink-0 text-right text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <Input
                  value={value}
                  placeholder="e.g. 200g fresh mozzarella"
                  onChange={(e) => updateIng(index, e.target.value)}
                  data-ocid={`recipe.ingredients.input.${index + 1}`}
                />
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === 0}
                    onClick={() => moveIng(index, -1)}
                    aria-label="Move ingredient up"
                    data-ocid={`recipe.ingredients.move_up.${index + 1}`}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === ing.length - 1}
                    onClick={() => moveIng(index, 1)}
                    aria-label="Move ingredient down"
                    data-ocid={`recipe.ingredients.move_down.${index + 1}`}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeIng(index)}
                    aria-label="Remove ingredient"
                    data-ocid={`recipe.ingredients.delete_button.${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Instructions */}
      <section
        className="flex flex-col gap-3 border-t-2 border-t-primary/40 pt-4"
        data-ocid="recipe.instructions.section"
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-semibold uppercase tracking-wide">
              Instructions
            </h3>
            <span className="text-xs text-muted-foreground">
              {ins.length} step{ins.length === 1 ? "" : "s"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIns}
            data-ocid="recipe.instructions.add_button"
          >
            <Plus className="size-4" /> Add step
          </Button>
        </header>

        {ins.length === 0 ? (
          <p
            className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground"
            data-ocid="recipe.instructions.empty_state"
          >
            No instructions yet. Add the cooking steps in order.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {ins.map((value, index) => (
              <li
                key={value}
                className="flex items-start gap-2"
                data-ocid={`recipe.instructions.item.${index + 1}`}
              >
                <span className="mt-2.5 w-6 shrink-0 text-right text-sm font-medium text-muted-foreground">
                  {index + 1}.
                </span>
                <Textarea
                  value={value}
                  placeholder="e.g. Preheat the oven to 220°C."
                  rows={2}
                  onChange={(e) => updateIns(index, e.target.value)}
                  data-ocid={`recipe.instructions.input.${index + 1}`}
                />
                <div className="mt-0.5 flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === 0}
                    onClick={() => moveIns(index, -1)}
                    aria-label="Move instruction up"
                    data-ocid={`recipe.instructions.move_up.${index + 1}`}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === ins.length - 1}
                    onClick={() => moveIns(index, 1)}
                    aria-label="Move instruction down"
                    data-ocid={`recipe.instructions.move_down.${index + 1}`}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeIns(index)}
                    aria-label="Remove instruction"
                    data-ocid={`recipe.instructions.delete_button.${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button
          type="button"
          onClick={save}
          disabled={mut.isPending || !dirty}
          data-ocid="recipe.save_button"
        >
          {mut.isPending && <Loader2 className="size-4 animate-spin" />}
          Save recipe
        </Button>
      </div>
    </div>
  );
}
