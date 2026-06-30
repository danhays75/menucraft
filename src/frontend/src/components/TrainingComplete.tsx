// Completion confirmation shown after the final training step. Celebratory
// but calm — a check badge, headline, supporting copy, and two CTAs (review
// the recipe again, or return to the storefront). Animates in with a gentle
// scale+fade.

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemId } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, RotateCcw, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";

export function TrainingComplete({
  itemId,
  itemName,
  totalSteps,
}: {
  itemId: ItemId;
  itemName: string;
  totalSteps: number;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto max-w-xl"
      data-ocid="training.complete"
    >
      <Card className="overflow-hidden border-primary/30 shadow-md">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 14,
            }}
            className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success"
            data-ocid="training.complete.badge"
          >
            <CheckCircle2 className="size-9" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Training complete
            </h2>
            <p className="text-muted-foreground">
              You&apos;ve walked through all {totalSteps} step
              {totalSteps === 1 ? "" : "s"} for{" "}
              <span className="font-medium text-foreground">{itemName}</span>.
              You&apos;re ready to plate it.
            </p>
          </div>

          <div
            className="mt-2 flex flex-col gap-3 sm:flex-row"
            data-ocid="training.complete.actions"
          >
            <Button
              asChild
              size="lg"
              data-ocid="training.complete.review_button"
            >
              <a
                href={`/item/${itemId}`}
                data-ocid="training.complete.review_link"
              >
                <UtensilsCrossed className="size-4" />
                Review the recipe
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: "/" })}
              data-ocid="training.complete.home_button"
            >
              <RotateCcw className="size-4" />
              Back to menu
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Progress resets when you leave training — revisit any time to
            refresh.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
