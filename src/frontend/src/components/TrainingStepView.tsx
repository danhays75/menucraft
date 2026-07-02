// Renders a single training step: large media area (optional photo and/or
// video) above the step's text instructions. Motion is keyed by step index so
// advancing triggers a directional slide+fade; direction flips on Back.
// Dark roadhouse styling: red step label, Oswald step number, dark card media.

import { blobUrl } from "@/lib/blob";
import type { TrainingStepPublic } from "@/types";
import { ImageIcon, Video } from "lucide-react";
import { motion } from "motion/react";

export function TrainingStepView({
  step,
  index,
  direction,
}: {
  step: TrainingStepPublic;
  index: number;
  direction: 1 | -1;
}) {
  const photoUrl = blobUrl(step.photo);
  const videoUrl = blobUrl(step.video, "");
  const hasPhoto = !!step.photo;
  const hasVideo = !!step.video && videoUrl !== "";

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: direction === 1 ? 40 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction === 1 ? -40 : 40 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="grid gap-6 lg:grid-cols-5"
      data-ocid={`training.step.${index + 1}`}
    >
      {/* Media area — large, prominent. */}
      <div
        className="lg:col-span-3"
        data-ocid={`training.step.${index + 1}.media`}
      >
        {hasVideo ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full object-cover"
              data-ocid={`training.step.${index + 1}.video`}
              aria-label={`Step ${index + 1} video demonstration`}
            >
              <track kind="captions" />
            </video>
          </div>
        ) : hasPhoto ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <img
              src={photoUrl}
              alt={`Step ${index + 1} reference`}
              className="aspect-video w-full object-cover"
              data-ocid={`training.step.${index + 1}.photo`}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground"
            data-ocid={`training.step.${index + 1}.media_empty`}
          >
            <ImageIcon className="size-8" />
            <span className="text-sm">No media for this step</span>
          </div>
        )}

        {/* If both photo and video exist, show the photo as a thumbnail strip
            beneath the video so neither medium is lost. */}
        {hasVideo && hasPhoto && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="size-3.5" />
            <span>Reference photo included with this step.</span>
          </div>
        )}
      </div>

      {/* Text instructions. */}
      <div
        className="lg:col-span-2 flex flex-col"
        data-ocid={`training.step.${index + 1}.text`}
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Video className="size-3.5" />
          Step {index + 1}
        </span>
        <p className="mt-3 whitespace-pre-line font-body text-lg leading-relaxed text-foreground">
          {step.text}
        </p>
      </div>
    </motion.div>
  );
}
