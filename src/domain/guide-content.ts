/**
 * Build 2A.2 content rules.
 *
 * `GuideVersion.contentMarkdown` is the single canonical, persisted content
 * representation. The rich-text editor is only an editing interface: it parses
 * from Markdown on load and serializes back to Markdown on change, so the
 * editor implementation can be replaced later without a domain migration.
 *
 * No editor-specific JSON/document format is ever persisted.
 */

export const EMPTY_CONTENT_MARKDOWN = "";

/** Optional starting structure — offered, never forced. */
export const STARTER_CONTENT_MARKDOWN = `# Overview

## Steps

1. 

## Additional Information
`;

export class GuideContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuideContentError";
  }
}

/** Practical validation only: content must be a string of sane size. */
export function assertContentMarkdownValid(content: unknown): asserts content is string {
  if (typeof content !== "string") {
    throw new GuideContentError("Guide content must be Markdown text.");
  }
  if (content.length > 200_000) {
    throw new GuideContentError("Guide content exceeds the 200,000 character limit.");
  }
}

/** Shared URL rule for links, images and video references. */
export function isValidContentUrl(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;
  try {
    const url = new URL(candidate);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Image-specific rule: images are dereferenced by the browser, so only
 * http(s) sources are ever acceptable. mailto:, javascript:, data:, file:
 * and every other scheme are rejected. Used at the insertion boundary and
 * again when rendering the preview.
 */
export function isSafeImageUrl(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;
  try {
    const protocol = new URL(candidate).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function contentIsEmpty(content: string): boolean {
  return content.replace(/\s/g, "").length === 0;
}

/**
 * Recognizes a YouTube-style URL so the preview can render a clear embedded
 * video reference. The persisted Markdown stays an ordinary Markdown link.
 */
export function youTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith("/embed/")) return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Content readiness (review precondition)                             */
/* ------------------------------------------------------------------ */

/**
 * Content readiness is a domain rule, not a UI nicety: a GuideVersion with no
 * authored content is not a reviewable artefact. Centralized here so the UI
 * indicator, the workflow panel and the provider all agree.
 */
export function versionHasContent(contentMarkdown: string): boolean {
  return !contentIsEmpty(contentMarkdown);
}

export class EmptyGuideContentError extends Error {
  constructor(versionNumber: string) {
    super(
      `Version ${versionNumber} has no content. Add guide content before submitting it for review.`,
    );
    this.name = "EmptyGuideContentError";
  }
}

/** Provider-boundary guard for the submit-for-review transition. */
export function assertContentReadyForReview(contentMarkdown: string, versionNumber: string): void {
  if (!versionHasContent(contentMarkdown)) throw new EmptyGuideContentError(versionNumber);
}
