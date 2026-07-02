// LogoUpload — file upload for the brand logo with a live preview. Mirrors the
// PhotoUpload pattern (reads a browser File, builds an ExternalBlob via
// fileToBlob, surfaces upload progress) but tuned for a horizontal logo:
// a wider preview, transparent-friendly background, and a remove affordance.
// The parent owns the committed blob and decides when to call useUpdateLogo.

import type { ExternalBlob } from "@/backend";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { blobUrl, fileToBlob } from "@/lib/blob";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface LogoUploadProps {
  /** Current logo blob (controlled). */
  value?: ExternalBlob | null;
  /** Called with the new ExternalBlob once a file is prepared, or null on remove. */
  onChange: (blob: ExternalBlob | null) => void;
  ocid: string;
}

type Stage = "idle" | "preparing" | "uploading" | "ready" | "error";

export function LogoUpload({ value, onChange, ocid }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Resolve a preview URL whenever the value changes.
  useEffect(() => {
    if (!value) {
      setPreviewSrc(null);
      return;
    }
    const direct = blobUrl(value, "");
    if (direct) {
      setPreviewSrc(direct);
      return;
    }
    // Fall back to an object URL from the raw bytes for a fresh upload.
    let cancelled = false;
    value
      .getBytes()
      .then((bytes) => {
        if (cancelled) return;
        setPreviewSrc(URL.createObjectURL(new Blob([bytes])));
      })
      .catch(() => setPreviewSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function handleFile(file: File) {
    setErrorMsg(null);
    setStage("preparing");
    setProgress(0);
    try {
      const blob = await fileToBlob(file);
      setStage("uploading");
      const tracked = blob.withUploadProgress((pct: number) => {
        setProgress(pct);
        if (pct >= 100) setStage("ready");
      });
      onChange(tracked);
    } catch (err) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not read file");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function clear() {
    onChange(null);
    setStage("idle");
    setProgress(0);
    setErrorMsg(null);
  }

  const busy = stage === "preparing" || stage === "uploading";
  const showProgress = stage === "uploading" || stage === "ready";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Brand logo</span>

      <div className="flex items-start gap-4">
        {/* Preview — wide to suit a horizontal logo, dark checkerboard bg for transparency */}
        <div
          className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-input"
          style={{
            backgroundColor: "oklch(0.2 0.005 75)",
            backgroundImage:
              "linear-gradient(45deg, oklch(0.24 0.005 75) 25%, transparent 25%), linear-gradient(-45deg, oklch(0.24 0.005 75) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, oklch(0.24 0.005 75) 75%), linear-gradient(-45deg, transparent 75%, oklch(0.24 0.005 75) 75%)",
            backgroundSize: "12px 12px",
            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Logo preview"
              className="max-h-full max-w-full object-contain p-1.5"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              data-ocid={`${ocid}.upload_button`}
            >
              <ImagePlus className="size-4" />
              {value ? "Replace logo" : "Choose logo"}
            </Button>
            {value && !busy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                data-ocid={`${ocid}.clear_button`}
              >
                <X className="size-4" /> Remove
              </Button>
            )}
          </div>

          {showProgress && (
            <div
              className="flex flex-col gap-1"
              data-ocid={`${ocid}.loading_state`}
            >
              <Progress value={progress} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {stage === "ready" ? "Ready" : `Uploading… ${progress}%`}
              </span>
            </div>
          )}

          {stage === "error" && errorMsg && (
            <p
              className="text-xs text-destructive"
              data-ocid={`${ocid}.error_state`}
            >
              {errorMsg}
            </p>
          )}

          {!showProgress && stage !== "error" && (
            <p className="text-xs text-muted-foreground">
              PNG with transparency works best. Up to ~5 MB.
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onInputChange}
        data-ocid={`${ocid}.input`}
      />
    </div>
  );
}
