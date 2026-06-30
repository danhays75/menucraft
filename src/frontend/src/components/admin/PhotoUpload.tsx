// Reusable photo upload control. Reads a browser File, builds an ExternalBlob
// via fileToBlob, registers an upload-progress callback on the blob (fired
// later when the parent form submits and the actor serializes the blob), and
// shows a live preview. Used by category and menu-item admin forms.
//
// Stage model:
//   idle       — no file selected yet
//   preparing  — reading the file into an ExternalBlob (local I/O)
//   ready      — file prepared, progress callback registered; will upload on
//                save. The progress bar reflects the registered callback and
//                advances 0→100 during the real (submit-time) upload for as
//                long as this component stays mounted.
//   error      — file could not be read
//
// Note: the actual bytes upload happens at form-submit time inside the actor
// (to_candid_ExternalBlob → _uploadFile → storageClient.putFile(bytes,
// onProgress)). The onProgress closure below references this component's
// state setters, so progress advances whenever the parent keeps this control
// mounted during the submit mutation.

import type { ExternalBlob } from "@/backend";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { blobUrl, fileToBlob } from "@/lib/blob";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface PhotoUploadProps {
  /** Current blob value (controlled). */
  value?: ExternalBlob | null;
  /** Called with the new ExternalBlob once a file is selected and prepared. */
  onChange: (blob: ExternalBlob | null) => void;
  /** Optional label above the dropzone. */
  label?: string;
  /** Square preview size in px (default 96). */
  previewSize?: number;
  /** Hint text shown under the dropzone. */
  hint?: string;
}

type Stage = "idle" | "preparing" | "ready" | "error";

export function PhotoUpload({
  value,
  onChange,
  label = "Cover photo",
  previewSize = 96,
  hint = "JPG, PNG, or WebP — up to ~5 MB",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Remember the MIME of the currently-selected file so the preview object URL
  // is created with a real image type. ExternalBlob.fromBytes (in backend.ts)
  // hardcodes 'application/octet-stream' on its internal blob: URL, which
  // browsers refuse to render in <img>. We rebuild the URL from getBytes()
  // with the correct MIME for fresh uploads.
  const lastMimeTypeRef = useRef<string>("image/jpeg");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Resolve a preview URL whenever the value changes. For fresh uploads the
  // blob's directURL is a blob: URL with an octet-stream MIME that won't
  // render, so we fall back to getBytes() and rebuild the object URL with the
  // remembered image MIME. For already-uploaded blobs the directURL is an
  // http(s) URL that renders directly.
  useEffect(() => {
    if (!value) {
      setPreviewSrc(null);
      return;
    }
    const direct = blobUrl(value, "");
    // http(s) URLs from prior uploads render directly. blob: URLs come from
    // ExternalBlob.fromBytes with an octet-stream MIME, so rebuild them.
    if (direct && !direct.startsWith("blob:")) {
      setPreviewSrc(direct);
      return;
    }
    // Fresh upload (or fallback): rebuild an object URL with the correct MIME.
    let cancelled = false;
    let createdUrl: string | null = null;
    value
      .getBytes()
      .then((bytes) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(
          new Blob([bytes], { type: lastMimeTypeRef.current || "image/jpeg" }),
        );
        setPreviewSrc(createdUrl);
      })
      .catch(() => setPreviewSrc(null));
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [value]);

  async function handleFile(file: File) {
    setErrorMsg(null);
    setStage("preparing");
    setProgress(0);
    lastMimeTypeRef.current = file.type || "image/jpeg";
    try {
      const blob = await fileToBlob(file);
      // The file is prepared (bytes read into the ExternalBlob) and the
      // progress callback is registered. The real upload happens later, at
      // form-submit time, when the actor serializes this blob. We mark the
      // control "ready" — NOT "uploading" — because nothing is uploading
      // yet. The progress bar will advance 0→100 during the submit mutation
      // for as long as this component stays mounted.
      const tracked = blob.withUploadProgress((pct: number) => {
        setProgress(pct);
      });
      setStage("ready");
      onChange(tracked);
    } catch (err) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not read file");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
  }

  function clear() {
    onChange(null);
    setStage("idle");
    setProgress(0);
    setErrorMsg(null);
  }

  const busy = stage === "preparing";
  const showProgress = stage === "ready";

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}

      <div className="flex items-start gap-4">
        {/* Preview / dropzone */}
        <div
          className="relative shrink-0 overflow-hidden rounded-lg border border-input bg-muted/30"
          style={{ width: previewSize, height: previewSize }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Selected file preview"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-5" />
            </div>
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
              data-ocid="photo.upload_button"
            >
              <ImagePlus className="size-4" />
              {value ? "Replace photo" : "Choose photo"}
            </Button>
            {value && !busy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                data-ocid="photo.clear_button"
              >
                <X className="size-4" /> Remove
              </Button>
            )}
          </div>

          {showProgress && (
            <div
              className="flex flex-col gap-1"
              data-ocid="photo.loading_state"
            >
              <Progress value={progress} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {progress >= 100
                  ? "Uploaded"
                  : progress > 0
                    ? `Uploading… ${progress}%`
                    : "Ready to upload on save"}
              </span>
            </div>
          )}

          {stage === "error" && errorMsg && (
            <p
              className="text-xs text-destructive"
              data-ocid="photo.error_state"
            >
              {errorMsg}
            </p>
          )}

          {hint && !showProgress && stage !== "error" && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onInputChange}
        data-ocid="photo.input"
      />
    </div>
  );
}
