// StorefrontHomePage — landing page: hero section + responsive grid of
// CategoryCard components. Uses useCategories hook. Public — no login needed.

import { CategoryCard } from "@/components/CategoryCard";
import { Section } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChefHat, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";

export function StorefrontHomePage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <>
      {/* Hero */}
      <Section className="py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ChefHat className="size-3.5 text-primary" /> MenuCraft Kitchen
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            A photo-driven menu,
            <br className="hidden sm:block" />{" "}
            <span className="text-gradient-primary">recipe & training</span>{" "}
            studio
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Browse categories and dishes, follow step-by-step recipe cards, and
            train your kitchen staff — all in one warm, editorial space.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" data-ocid="home.explore_button">
              <a href="#categories" data-ocid="home.explore_link">
                Explore the menu
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              data-ocid="home.about_button"
            >
              <Link to="/" data-ocid="home.about_link">
                How it works
              </Link>
            </Button>
          </div>
        </motion.div>
      </Section>

      {/* Categories grid */}
      <Section id="categories" variant="muted" className="py-20 sm:py-24">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Browse by category
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tap a category to see every dish, its recipe, and training flow.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <UtensilsCrossed className="size-4 text-primary" />
            {categories ? categories.length : 0} categories
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {["skel-1", "skel-2", "skel-3", "skel-4", "skel-5", "skel-6"].map(
              (skel, i) => (
                <Skeleton
                  key={skel}
                  className="aspect-[4/3] w-full rounded-xl"
                  data-ocid={`home.category.loading_state.${i + 1}`}
                />
              ),
            )}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <motion.div
                key={String(category.id)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: index * 0.08,
                }}
              >
                <CategoryCard category={category} index={index} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-background px-6 py-14 text-center"
            data-ocid="home.category.empty_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UtensilsCrossed className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                No categories yet
              </h3>
              <p className="text-sm text-muted-foreground">
                The kitchen hasn't published any menu categories yet. Please
                check back soon.
              </p>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
