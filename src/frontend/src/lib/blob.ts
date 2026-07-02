// Helpers for working with ExternalBlob objects returned by the backend.
// ExternalBlob.getDirectURL() returns a browser-cached HTTP URL that can be
// used directly in <img src> / <video src> without fetching bytes.

import type { ExternalBlob } from "@/backend";

/** Safely resolve a display URL from an ExternalBlob, with a fallback. */
export function blobUrl(
  blob: ExternalBlob | undefined | null,
  fallback = "/assets/images/placeholder.svg",
): string {
  if (!blob) return fallback;
  try {
    return blob.getDirectURL() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Build an ExternalBlob from a browser File for upload via the actor.
 *
 * The constructor is imported from `@caffeineai/object-storage` (the package
 * that owns the class) rather than `@/backend`, because `backend.ts` only
 * re-exports `ExternalBlob` as a type (`export type { ExternalBlob }`), which
 * Rollup correctly erases at runtime. Importing the value from the source
 * package keeps the runtime class available while the type still flows through
 * `@/backend` for actor compatibility.
 */
import { ExternalBlob as ExternalBlobCtor } from "@caffeineai/object-storage";

export function fileToBlob(file: File): Promise<ExternalBlob> {
  return file
    .arrayBuffer()
    .then((buf) => ExternalBlobCtor.fromBytes(new Uint8Array(buf)));
}
