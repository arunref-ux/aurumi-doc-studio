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
