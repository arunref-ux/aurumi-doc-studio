import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  SquareCode,
  Unlink,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Markdown } from "tiptap-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  isSafeImageUrl,
  isValidContentUrl,
  STARTER_CONTENT_MARKDOWN,
} from "@/domain/guide-content";

/**
 * Rich content authoring interface (Build 2A.2).
 *
 * Markdown in, Markdown out. Tiptap/ProseMirror state exists only for the
 * duration of the editing session; the canonical representation handed back to
 * the workspace — and therefore persisted on the GuideVersion — is always
 * Markdown. Replacing this component later requires no domain migration.
 */

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] }),
  Image.configure({ inline: false }),
  // Conversion boundary: parses the incoming Markdown and serializes back to it.
  Markdown.configure({ html: false, linkify: true, breaks: false, transformPastedText: true }),
];

/** Single conversion boundary: ProseMirror state -> canonical Markdown. */
function toMarkdown(editor: Editor): string {
  const storage = editor.storage["markdown"] as { getMarkdown: () => string };
  return storage.getMarkdown();
}

export function RichContentEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "guide-prose min-h-[420px] px-5 py-4 outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(toMarkdown(instance));
    },
  });

  // Re-hydrate when a different guide/version is loaded, or after an external
  // reset. Never overwrite the document while the author is typing.
  useEffect(() => {
    if (!editor) return;
    const current = toMarkdown(editor);
    if (current !== value && !editor.isFocused) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[420px] px-5 py-4 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {editor.isEmpty ? <EmptyContentHint editor={editor} /> : null}
    </div>
  );
}

function EmptyContentHint({ editor }: { editor: Editor }) {
  return (
    <div className="border-t border-dashed border-border px-5 py-4 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Start writing your guide.</p>
      <p className="mt-1">
        You can create step-by-step instructions, add links, images and videos.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => editor.chain().focus().setContent(STARTER_CONTENT_MARKDOWN).run()}
      >
        Insert optional starting structure
      </Button>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Toggle
      size="sm"
      pressed={Boolean(active)}
      onPressedChange={onClick}
      aria-label={label}
      title={label}
      className="size-8 p-0"
    >
      {children}
    </Toggle>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-3 py-2">
      <ToolButton
        label="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="size-4" />
      </ToolButton>
      <ToolButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolButton>
      <ToolButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolButton>
      <ToolButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolButton>
      <ToolButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolButton>
      <ToolButton
        label="Quote / callout"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolButton
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolButton>
      <ToolButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode className="size-4" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <LinkDialog editor={editor} />
      <ToolButton
        label="Remove link"
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink className="size-4" />
      </ToolButton>
      <ImageDialog editor={editor} />
      <VideoDialog editor={editor} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* URL-based insertion dialogs (no upload/storage infrastructure)      */
/* ------------------------------------------------------------------ */

function useUrlField(
  initial = "",
  validate: (value: string) => boolean = isValidContentUrl,
) {
  const [url, setUrl] = useState(initial);
  const [touched, setTouched] = useState(false);
  const valid = validate(url);
  return { url, setUrl, touched, setTouched, valid };
}

function UrlError({ show, message }: { show: boolean; message?: string }) {
  return show ? (
    <p className="text-xs text-destructive">
      {message ?? "Enter a valid http(s) URL."}
    </p>
  ) : null;
}

function LinkDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const field = useUrlField();

  useEffect(() => {
    if (open) field.setUrl((editor.getAttributes("link")["href"] as string) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const apply = () => {
    if (!field.valid) {
      field.setTouched(true);
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: field.url.trim() }).run();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0" title="Add or edit link">
          <LinkIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add or edit link</DialogTitle>
          <DialogDescription>
            Select text first, then set the destination URL. Saved as standard Markdown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            value={field.url}
            onChange={(event) => field.setUrl(event.target.value)}
            placeholder="https://help.aurumi.example.com/guides/create-deal"
          />
          <UrlError show={field.touched && !field.valid} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Apply link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState("");
  // Images are dereferenced by the browser: http(s) only, no mailto:/data:/etc.
  const field = useUrlField("", isSafeImageUrl);

  const apply = () => {
    const src = field.url.trim();
    // Insertion boundary guard — an unsafe image can never enter the Markdown.
    if (!isSafeImageUrl(src)) {
      field.setTouched(true);
      return;
    }
    // Markdown image syntax: ![alt](url). No binary data is ever embedded.
    editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
    setOpen(false);
    field.setUrl("");
    setAlt("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0" title="Insert image">
          <ImageIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>
            Reference an existing image URL. File upload and storage are not part of this build.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={field.url}
              onChange={(event) => field.setUrl(event.target.value)}
              placeholder="https://…/deal-form.png"
            />
            <UrlError
              show={field.touched && !field.valid}
              message="Image URLs must start with http:// or https://."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-alt">Alt text (optional)</Label>
            <Input
              id="image-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Deal creation form"
            />
          </div>
          {field.valid ? (
            <img
              src={field.url}
              alt={alt || "Image preview"}
              className="max-h-48 w-full rounded-md border border-border object-contain"
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Insert image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoDialog({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const field = useUrlField();

  const apply = () => {
    if (!field.valid) {
      field.setTouched(true);
      return;
    }
    // Portable Markdown: a plain link on its own paragraph. The preview
    // upgrades recognized YouTube URLs to an embed; everything else stays a
    // clickable video link. No editor-only video node is persisted.
    const text = label.trim() || "Watch the video";
    editor
      .chain()
      .focus()
      .insertContent({
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
            marks: [{ type: "link", attrs: { href: field.url.trim() } }],
          },
        ],
      })
      .run();
    setOpen(false);
    field.setUrl("");
    setLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="size-8 p-0" title="Add video reference">
          <Video className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add video reference</DialogTitle>
          <DialogDescription>
            YouTube URLs render as an embedded player in Preview. Other URLs render as a clear
            video link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              value={field.url}
              onChange={(event) => field.setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <UrlError show={field.touched && !field.valid} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-label">Link text (optional)</Label>
            <Input
              id="video-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Watch the deal walkthrough"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Add video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
