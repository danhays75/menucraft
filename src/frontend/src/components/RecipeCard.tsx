// RecipeCard — editorial recipe view: smaller square dish photo alongside
// the dish name + description, a full ingredients list, a numbered
// instructions list, and a red 'Start Training' CTA linking to the
// step-by-step training flow. Dark roadhouse styling with gold accents for
// ingredient bullets and section dividers. Public — no login required.

import { Button } from "@/components/ui/button";
import { blobUrl } from "@/lib/blob";
import type { MenuItemPublic } from "@/types";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChefHat, ListOrdered, Salad } from "lucide-react";

export function RecipeCard({ item }: { item: MenuItemPublic }) {
  const photoUrl = blobUrl(item.itemPhoto);
  const hasIngredients = item.ingredients.length > 0;
  const hasInstructions = item.instructions.length > 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Header — small square dish photo + name + description */}
      <div className="flex flex-col gap-5 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8">
        <div className="size-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:size-32">
          <img
            src={photoUrl}
            alt={item.name}
            className="size-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ChefHat className="size-3" /> Recipe
          </span>
          <h1 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">
            {item.name}
          </h1>
          {item.description && (
            <p className="max-w-2xl text-base text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Body — ingredients + instructions in two columns on larger screens */}
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2 md:gap-10">
        {/* Ingredients */}
        <section aria-labelledby="ingredients-heading">
          <h2
            id="ingredients-heading"
            className="flex items-center gap-2 font-heading text-xl font-semibold uppercase tracking-wide"
          >
            <Salad className="size-5 text-accent" /> Ingredients
          </h2>
          <div className="mt-4 h-px w-12 bg-accent/60" />
          {hasIngredients ? (
            <ul
              className="mt-5 space-y-2.5"
              data-ocid="recipe.ingredients.list"
            >
              {item.ingredients.map((ingredient, i) => (
                <li
                  key={ingredient}
                  className="flex items-start gap-3 text-sm text-foreground"
                  data-ocid={`recipe.ingredients.item.${i + 1}`}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="leading-relaxed">{ingredient}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No ingredients listed yet.
            </p>
          )}
        </section>

        {/* Instructions */}
        <section aria-labelledby="instructions-heading">
          <h2
            id="instructions-heading"
            className="flex items-center gap-2 font-heading text-xl font-semibold uppercase tracking-wide"
          >
            <ListOrdered className="size-5 text-primary" /> Instructions
          </h2>
          <div className="mt-4 h-px w-12 bg-primary/60" />
          {hasInstructions ? (
            <ol className="mt-5 space-y-4" data-ocid="recipe.instructions.list">
              {item.instructions.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-3.5 text-sm text-foreground"
                  data-ocid={`recipe.instructions.item.${i + 1}`}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No instructions listed yet.
            </p>
          )}
        </section>
      </div>

      {/* Footer — Start Training CTA */}
      <div className="flex flex-col items-start gap-4 border-t border-border bg-muted/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-1">
          <p className="font-heading text-lg font-semibold uppercase tracking-wide">
            Ready to cook?
          </p>
          <p className="text-sm text-muted-foreground">
            Walk through this recipe step-by-step with the staff training flow.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0"
          data-ocid="recipe.start_training_button"
        >
          <Link
            to="/item/$id/training"
            params={{ id: String(item.id) }}
            data-ocid="recipe.start_training_link"
          >
            Start training
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
