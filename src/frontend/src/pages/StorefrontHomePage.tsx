// StorefrontHomePage — landing page: hero section + responsive grid of
// PositionCard tiles. Uses usePositions + toPositionView. Public — no login
// needed. Positions are the top-level grouping (e.g. Bartender) above
// categories; the home grid now surfaces them instead of categories.

import { Section } from "@/components/Layout";
import { PositionCard } from "@/components/PositionCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePositions } from "@/hooks/useQueries";
import { toPositionView } from "@/types";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, ChefHat } from "lucide-react";
import { motion } from "motion/react";

export function StorefrontHomePage() {
  const { data: positions, isLoading } = usePositions();
  const views = (positions ?? []).map(toPositionView);
  const count = views.length;

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
            Browse training positions and their dishes, follow step-by-step
            recipe cards, and train your kitchen staff — all in one warm,
            editorial space.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" data-ocid="home.explore_button">
              <a href="#positions" data-ocid="home.explore_link">
                Explore positions
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

      {/* Positions grid */}
      <Section id="positions" variant="muted" className="py-20 sm:py-24">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Training positions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tap a position to see its categories, recipes, and training flow.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="size-4 text-primary" />
            {count} {count === 1 ? "position" : "positions"}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {["skel-1", "skel-2", "skel-3", "skel-4", "skel-5", "skel-6"].map(
              (skel, i) => (
                <Skeleton
                  key={skel}
                  className="aspect-[4/3] w-full rounded-xl"
                  data-ocid={`home.position.loading_state.${i + 1}`}
                />
              ),
            )}
          </div>
        ) : count > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((position, index) => (
              <motion.div
                key={String(position.id)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: index * 0.08,
                }}
              >
                <PositionCard position={position} index={index} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-background px-6 py-14 text-center"
            data-ocid="home.position.empty_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                No positions yet
              </h3>
              <p className="text-sm text-muted-foreground">
                The kitchen hasn&apos;t published any training positions yet.
                Please check back soon.
              </p>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
