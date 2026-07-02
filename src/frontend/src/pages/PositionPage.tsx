// PositionPage — storefront view for a single Position, showing its categories
// as a grid of CategoryCard tiles. Mirrors CategoryPage's structure: a muted
// header band with a Home > Position breadcrumb, the position name as a serif
// heading with an optional description, then a background band with the
// category grid. From any CategoryCard the existing /category/$id flow
// (sub-categories, items, training steps) works unchanged. Public — no login.

import { CategoryCard } from "@/components/CategoryCard";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Layout";
import { QuizCard } from "@/components/QuizCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useCategoriesByPosition,
  usePosition,
  useQuizzesByPosition,
} from "@/hooks/useQueries";
import { toCategoryView, toPositionView, toQuizView } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  ClipboardList,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";

const GRID_CLASSES = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function PositionPage() {
  const { id } = useParams({ from: "/storefront-layout/position/$id" });
  const positionId = BigInt(id);

  const { isAuthenticated } = useAuth();
  const { data: position, isLoading: positionLoading } =
    usePosition(positionId);
  const { data: categories, isLoading: categoriesLoading } =
    useCategoriesByPosition(positionId);
  // Quizzes are only fetched when the user is signed in — the section is
  // hidden from anonymous visitors (storefront browsing is public).
  const { data: quizzes, isLoading: quizzesLoading } = useQuizzesByPosition(
    isAuthenticated ? positionId : undefined,
  );

  const isLoading = positionLoading || categoriesLoading;
  const categoryCount = categories?.length ?? 0;
  const hasCategories = !categoriesLoading && categoryCount > 0;
  const showEmpty =
    !isLoading && !positionLoading && !hasCategories && !!position;

  // Sort categories by their display sortOrder for a stable grid.
  const sortedCategories = (categories ?? [])
    .map((c) => ({ raw: c, view: toCategoryView(c) }))
    .sort((a, b) => a.view.sortOrder - b.view.sortOrder);

  // Sort quizzes newest-first (no sortOrder field on quizzes).
  const sortedQuizzes = (quizzes ?? [])
    .map((q) => toQuizView(q))
    .sort((a, b) => Number(b.updatedAt - a.updatedAt));
  const quizCount = sortedQuizzes.length;
  const quizzesLoadingState = isAuthenticated && quizzesLoading;

  const positionView = position ? toPositionView(position) : null;

  return (
    <>
      {/* Breadcrumb + header band */}
      <Section variant="muted" className="py-10 sm:py-12">
        <nav
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="position.breadcrumb_home"
          >
            <Link to="/" data-ocid="position.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="font-medium text-foreground"
            data-ocid="position.breadcrumb_current"
          >
            {positionLoading ? "Loading…" : (positionView?.name ?? "Position")}
          </span>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <Briefcase className="size-3" /> Position
            </span>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {positionLoading ? (
                <Skeleton
                  className="h-10 w-48"
                  data-ocid="position.title.loading_state"
                />
              ) : (
                (positionView?.name ?? "Position")
              )}
            </h1>
            {positionView?.description ? (
              <p className="max-w-2xl text-muted-foreground">
                {positionView.description}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {isLoading
                ? "Loading categories…"
                : `${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
            </p>
          </div>
        </div>
      </Section>

      {/* Categories grid */}
      <Section className="py-16 sm:py-20">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className={GRID_CLASSES}>
              {["skel-1", "skel-2", "skel-3", "skel-4", "skel-5", "skel-6"].map(
                (skel, i) => (
                  <Skeleton
                    key={skel}
                    className="aspect-[4/3] w-full rounded-xl"
                    data-ocid={`position.category.loading_state.${i + 1}`}
                  />
                ),
              )}
            </div>
          </div>
        ) : !position ? (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
            data-ocid="position.error_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Briefcase className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Position not found
              </h2>
              <p className="text-sm text-muted-foreground">
                The position you're looking for doesn't exist or has been
                removed.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              data-ocid="position.error_state.back_button"
            >
              <Link to="/" data-ocid="position.error_state.back_link">
                Back to home
              </Link>
            </Button>
          </div>
        ) : showEmpty ? (
          <EmptyState
            ocid="position.category.empty_state"
            title="No categories in this position yet"
            description="This position doesn't have any categories published yet. Check back soon — the kitchen is always adding new collections."
            backLabel="Back to home"
          />
        ) : (
          <section className="space-y-5" data-ocid="position.category.section">
            <div className="flex items-center gap-2.5">
              <UtensilsCrossed className="size-5 text-primary" />
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Categories
              </h2>
              <span className="text-sm text-muted-foreground">
                {categoryCount}{" "}
                {categoryCount === 1 ? "category" : "categories"}
              </span>
            </div>
            <div className={GRID_CLASSES}>
              {sortedCategories.map(({ raw }, index) => (
                <motion.div
                  key={String(raw.id)}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: index * 0.08,
                  }}
                >
                  <CategoryCard category={raw} index={index} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </Section>

      {/* Quizzes section — only visible to authenticated staff. Lists the
          quizzes attached to this position with Take / View-history actions. */}
      {isAuthenticated && position ? (
        <Section
          variant="muted"
          className="py-16 sm:py-20"
          data-ocid="position.quiz.section"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="size-5 text-primary" />
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Quizzes
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {quizzesLoadingState
                      ? "Loading…"
                      : `${quizCount} ${quizCount === 1 ? "quiz" : "quizzes"}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Test your knowledge of this position. Retakes are unlimited.
                </p>
              </div>
              {quizCount > 0 ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  data-ocid="position.quiz.view_all_button"
                >
                  <Link
                    to="/position/$id/quizzes"
                    params={{ id }}
                    data-ocid="position.quiz.view_all_link"
                  >
                    View all quizzes
                  </Link>
                </Button>
              ) : null}
            </div>

            {quizzesLoadingState ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {["qskel-1", "qskel-2", "qskel-3"].map((skel, i) => (
                  <Skeleton
                    key={skel}
                    className="h-56 w-full rounded-xl"
                    data-ocid={`position.quiz.loading_state.${i + 1}`}
                  />
                ))}
              </div>
            ) : quizCount === 0 ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"
                data-ocid="position.quiz.empty_state"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ClipboardList className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    No quizzes for this position yet
                  </h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Your training team hasn&apos;t published any quizzes for
                    this position yet. Check back soon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedQuizzes.map((quiz, index) => (
                  <motion.div
                    key={String(quiz.id)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      delay: index * 0.08,
                    }}
                  >
                    <QuizCard quiz={quiz} index={index} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Section>
      ) : null}
    </>
  );
}

export default PositionPage;
