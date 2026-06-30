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

/** Build an ExternalBlob from a browser File for upload via the actor. */
import { ExternalBlob as ExternalBlobCtor } from "@/backend";

export function fileToBlob(file: File): Promise<ExternalBlob> {
  return file
    .arrayBuffer()
    .then((buf) => ExternalBlobCtor.fromBytes(new Uint8Array(buf)));
}
