// In-session progress indicator for the training flow. Shows "Step X of Y"
// alongside a progress bar that fills as the user advances. Stateless — driven
// entirely by the current/total props from TrainingPage.

import { Progress } from "@/components/ui/progress";

export function TrainingProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const safeTotal = Math.max(total, 1);
  const clamped = Math.min(Math.max(current, 1), safeTotal);
  const percent = Math.round((clamped / safeTotal) * 100);

  return (
    <div
      className="w-full"
      data-ocid="training.progress"
      aria-label={`Step ${clamped} of ${safeTotal}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          Step{" "}
          <span
            className="font-display text-lg text-primary"
            data-ocid="training.progress.current"
          >
            {clamped}
          </span>{" "}
          of{" "}
          <span
            className="text-muted-foreground"
            data-ocid="training.progress.total"
          >
            {safeTotal}
          </span>
        </span>
        <span
          className="text-xs font-medium tabular-nums text-muted-foreground"
          data-ocid="training.progress.percent"
        >
          {percent}%
        </span>
      </div>
      <Progress
        value={percent}
        className="h-2.5"
        data-ocid="training.progress.bar"
      />
    </div>
  );
}
