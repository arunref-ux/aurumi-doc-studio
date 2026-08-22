import { useEffect, useMemo, useState } from "react";
import { contentIsEmpty, isSafeImageUrl, youTubeEmbedUrl } from "@/domain/guide-content";

/**
 * Authoring preview (Build 2A.2) — NOT the public Help Portal.
 *
 * Renders the canonical Markdown safely: Markdown -> HTML -> sanitize. Raw HTML
 * in guide content is never trusted or executed, and sanitization runs in the
 * browser only (both libraries are imported lazily after hydration).
 */
export function MarkdownPreview({
  markdown,
  emptyState,
}: {
  markdown: string;
  /** Consumer surfaces (e.g. the Help Portal) override the authoring wording. */
  emptyState?: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [{ marked }, dompurifyModule] = await Promise.all([
          import("marked"),
          import("dompurify"),
        ]);
        const rendered = await marked.parse(markdown, { async: true, gfm: true });
        const sanitize = dompurifyModule.default.sanitize;
        const safe = sanitize(rendered, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
          FORBID_ATTR: ["style", "srcdoc", "onerror", "onload"],
        });
        if (!cancelled) setHtml(neutralizeUnsafeImages(safe));
      } catch {
        if (!cancelled) setHtml(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  const videos = useMemo(() => collectVideoReferences(markdown), [markdown]);

  if (contentIsEmpty(markdown)) {
    return (
      <div className="px-5 py-10 text-center text-xs text-muted-foreground">
        {emptyState ?? "No content yet. Switch to Edit and start writing your guide."}
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {html === null ? (
        <p className="text-sm text-muted-foreground">Rendering preview…</p>
      ) : (
        // Sanitized above; scripts, styles and raw iframes are stripped.
        <div className="guide-prose" dangerouslySetInnerHTML={{ __html: html }} />
      )}

      {videos.length > 0 ? (
        <section className="mt-6 space-y-3 border-t border-border pt-4">
          <h3 className="label-caps">Video references</h3>
          {videos.map((video) => (
            <div key={video.url} className="space-y-1">
              {video.embedUrl ? (
                <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-md border border-border">
                  <iframe
                    src={video.embedUrl}
                    title={video.label}
                    className="size-full"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm underline"
                >
                  Video: {video.label}
                </a>
              )}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

/**
 * Second safety gate for images: even if persisted Markdown already contains an
 * image with a non-http(s) source, it is never rendered as an active image. The
 * <img> is replaced by inert text so nothing is executed or dereferenced.
 */
function neutralizeUnsafeImages(html: string): string {
  if (typeof document === "undefined") return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const img of Array.from(template.content.querySelectorAll("img"))) {
    const src = img.getAttribute("src") ?? "";
    if (isSafeImageUrl(src)) continue;
    const note = document.createElement("span");
    note.className = "text-xs text-muted-foreground";
    note.textContent = `[Blocked image reference: unsupported URL scheme]`;
    img.replaceWith(note);
  }
  return template.innerHTML;
}

interface VideoReference {
  url: string;
  label: string;
  embedUrl: string | null;
}

/**
 * Video references stay portable Markdown links. This reader recognizes them
 * from the canonical Markdown — no editor-specific node type involved.
 */
function collectVideoReferences(markdown: string): VideoReference[] {
  const references = new Map<string, VideoReference>();
  const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  for (const match of markdown.matchAll(linkPattern)) {
    const label = match[1] ?? "";
    const url = match[2] ?? "";
    const embedUrl = youTubeEmbedUrl(url);
    const looksLikeVideo =
      embedUrl !== null ||
      /\b(video|watch|vimeo|loom)\b/i.test(label) ||
      /(vimeo\.com|loom\.com|\.mp4($|\?))/i.test(url);
    if (looksLikeVideo && !references.has(url)) {
      references.set(url, { url, label: label || url, embedUrl });
    }
  }
  return Array.from(references.values());
}
