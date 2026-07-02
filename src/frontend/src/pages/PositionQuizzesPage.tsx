// PositionQuizzesPage — standalone storefront page listing every quiz
// attached to a single position. Mirrors the data shown in the PositionPage
// quizzes section but as a full page (for direct linking / deep navigation).
// Public — no login required to view the list, though each "Take quiz" link
// routes to a ProtectedRoute-gated take page.

import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Layout";
import { QuizCard } from "@/components/QuizCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosition, useQuizzesByPosition } from "@/hooks/useQueries";
import { toPositionView, toQuizView } from "@/types";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import { motion } from "motion/react";

const GRID_CLASSES = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function PositionQuizzesPage() {
  const { id } = useParams({ from: "/storefront-layout/position/$id/quizzes" });
  const positionId = BigInt(id);

  const { data: position, isLoading: positionLoading } =
    usePosition(positionId);
  const { data: quizzes, isLoading: quizzesLoading } =
    useQuizzesByPosition(positionId);

  const isLoading = positionLoading || quizzesLoading;
  const quizCount = quizzes?.length ?? 0;
  const hasQuizzes = !quizzesLoading && quizCount > 0;
  const showEmpty = !isLoading && !hasQuizzes && !!position;

  const sortedQuizzes = (quizzes ?? [])
    .map((q) => toQuizView(q))
    // Newest first — quizzes have no sortOrder field, so use updatedAt desc.
    .sort((a, b) => Number(b.updatedAt - a.updatedAt));

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
            data-ocid="position_quizzes.breadcrumb_home"
          >
            <Link to="/" data-ocid="position_quizzes.breadcrumb_home_link">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid="position_quizzes.breadcrumb_position"
          >
            <Link
              to="/position/$id"
              params={{ id }}
              data-ocid="position_quizzes.breadcrumb_position_link"
            >
              {positionLoading
                ? "Loading…"
                : (positionView?.name ?? "Position")}
            </Link>
          </Button>
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
          <span
            className="font-medium text-foreground"
            data-ocid="position_quizzes.breadcrumb_current"
          >
            Quizzes
          </span>
        </nav>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            <ClipboardList className="size-3" /> Quizzes
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {positionLoading ? (
              <Skeleton
                className="h-10 w-56"
                data-ocid="position_quizzes.title.loading_state"
              />
            ) : (
              `${positionView?.name ?? "Position"} quizzes`
            )}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {isLoading
              ? "Loading quizzes…"
              : `${quizCount} ${quizCount === 1 ? "quiz" : "quizzes"} available. Take any quiz to test your knowledge — retakes are unlimited.`}
          </p>
        </div>
      </Section>

      {/* Quizzes grid */}
      <Section className="py-16 sm:py-20">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading quizzes…</span>
            </div>
            <div className={GRID_CLASSES}>
              {["skel-1", "skel-2", "skel-3"].map((skel, i) => (
                <Skeleton
                  key={skel}
                  className="h-56 w-full rounded-xl"
                  data-ocid={`position_quizzes.quiz.loading_state.${i + 1}`}
                />
              ))}
            </div>
          </div>
        ) : !position ? (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center"
            data-ocid="position_quizzes.error_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ClipboardList className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Position not found
              </h2>
              <p className="text-sm text-muted-foreground">
                The position you&apos;re looking for doesn&apos;t exist or has
                been removed.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              data-ocid="position_quizzes.error_state.back_button"
            >
              <Link to="/" data-ocid="position_quizzes.error_state.back_link">
                Back to home
              </Link>
            </Button>
          </div>
        ) : showEmpty ? (
          <EmptyState
            ocid="position_quizzes.empty_state"
            title="No quizzes for this position yet"
            description="This position doesn't have any quizzes published yet. Check back soon — new quizzes may be added by your training team."
            backLabel="Back to position"
          />
        ) : (
          <section className="space-y-5" data-ocid="position_quizzes.section">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="size-5 text-primary" />
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Available quizzes
              </h2>
              <span className="text-sm text-muted-foreground">
                {quizCount} {quizCount === 1 ? "quiz" : "quizzes"}
              </span>
            </div>
            <div className={GRID_CLASSES}>
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
          </section>
        )}
      </Section>
    </>
  );
}

export default PositionQuizzesPage;
