// QuizCard — display tile for a single quiz attached to a position. Shows the
// quiz title, optional description, question count, admin-set passing
// percentage, and two actions: "Take quiz" (links to the take flow) and
// "View history" (links to the trainee's attempt history for this quiz).
// Used by both the PositionPage quizzes section and the standalone
// PositionQuizzesPage so the visual treatment stays consistent.

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { QuizView } from "@/types";
import { Link } from "@tanstack/react-router";
import { ClipboardList, History, ListChecks, Target } from "lucide-react";

export function QuizCard({
  quiz,
  index,
}: {
  quiz: QuizView;
  index: number;
}) {
  const positionId = String(quiz.positionId);
  const quizId = String(quiz.id);
  const itemMarker = index + 1;

  return (
    <Card
      className="h-full gap-0 py-0 transition-smooth hover:shadow-elevated"
      data-ocid={`quiz.item.${itemMarker}`}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        {/* Header — title + question count badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <ClipboardList className="size-3" /> Quiz
            </span>
            <h3 className="font-display text-lg font-semibold leading-tight tracking-tight line-clamp-2">
              {quiz.title}
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 gap-1"
            data-ocid={`quiz.question_count.${itemMarker}`}
          >
            <ListChecks className="size-3" />
            {quiz.questionCount}{" "}
            {quiz.questionCount === 1 ? "question" : "questions"}
          </Badge>
        </div>

        {/* Description (optional) */}
        {quiz.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {quiz.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/70">
            No description provided.
          </p>
        )}

        {/* Passing percentage — admin-set threshold */}
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-ocid={`quiz.passing_percentage.${itemMarker}`}
        >
          <Target className="size-4 text-accent" />
          <span>
            Passing score:{" "}
            <span className="font-medium text-foreground">
              {quiz.passingPercentage}%
            </span>
          </span>
        </div>

        {/* Actions — Take quiz (primary) + View history (secondary) */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Button
            asChild
            size="sm"
            data-ocid={`quiz.take_button.${itemMarker}`}
          >
            <Link
              to="/position/$id/quizzes/$quizId/take"
              params={{ id: positionId, quizId }}
              data-ocid={`quiz.take_link.${itemMarker}`}
            >
              Take quiz
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5"
            data-ocid={`quiz.history_button.${itemMarker}`}
          >
            <Link
              to="/position/$id/quizzes/$quizId/history"
              params={{ id: positionId, quizId }}
              data-ocid={`quiz.history_link.${itemMarker}`}
            >
              <History className="size-3.5" />
              View history
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
