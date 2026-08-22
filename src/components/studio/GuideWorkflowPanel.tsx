import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Lock, Send, TriangleAlert, Undo2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuthorization } from "@/auth/AuthorizationContext";
import { guideCommands } from "@/commands/guide-commands";
import { useGuideCommand } from "@/commands/useGuideCommand";
import { StatusBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GuideActionKey } from "@/domain/permissions";
import {
  GUIDE_WORKFLOW_ACTION_LABELS,
  availableWorkflowActions,
  type GuideWorkflowAction,
} from "@/domain/guide-workflow";
import type { GuideWithVersion } from "@/domain/types";

/**
 * Build 2B — review & approval workflow surface.
 *
 * This component is a convenience layer only. Every action leaves through the
 * command bus (central action authorization) and the provider independently
 * re-validates the lifecycle transition, so a bypassed UI cannot corrupt state.
 *
 * Available actions are derived from the centralized transition policy
 * (`availableWorkflowActions`) intersected with the user's effective
 * permissions — no status comparisons are inlined here.
 */

const ACTION_KEYS: Record<GuideWorkflowAction, GuideActionKey> = {
  submit_for_review: "guide.action.submit_for_review",
  request_changes: "guide.action.request_changes",
  approve: "guide.action.approve",
};

const ACTION_ICONS: Record<GuideWorkflowAction, ReactNode> = {
  submit_for_review: <Send className="size-3.5" />,
  request_changes: <Undo2 className="size-3.5" />,
  approve: <CheckCircle2 className="size-3.5" />,
};

export function GuideWorkflowPanel({
  guide,
  /** True when the draft editing session has unsaved changes. */
  dirty = false,
  layout = "panel",
}: {
  guide: GuideWithVersion;
  dirty?: boolean;
  layout?: "panel" | "inline";
}) {
  const queryClient = useQueryClient();
  const { user, canRunAction } = useAuthorization();
  const submit = useGuideCommand(guideCommands.submitForReview);
  const requestChanges = useGuideCommand(guideCommands.requestChanges);
  const approve = useGuideCommand(guideCommands.approve);

  const [pending, setPending] = useState<GuideWorkflowAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  const version = guide.currentVersion;
  const actions = availableWorkflowActions(version.status).filter((action) =>
    canRunAction(ACTION_KEYS[action]),
  );

  const run = async (action: GuideWorkflowAction, reviewNote?: string) => {
    setPending(action);
    setError(null);
    const input = {
      guideId: guide.id,
      guideVersionId: version.id,
      actor: user?.name ?? "Unknown user",
      ...(reviewNote?.trim() ? { note: reviewNote.trim() } : {}),
    };
    try {
      if (action === "submit_for_review") await submit(input);
      else if (action === "request_changes") await requestChanges(input);
      else await approve(input);
      await queryClient.invalidateQueries();
      setNoteOpen(false);
      setNote("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workflow action failed.");
    } finally {
      setPending(null);
    }
  };

  const submitBlockedByDirty = dirty && actions.includes("submit_for_review");

  const body = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs">Version {version.versionNumber}</span>
        <StatusBadge status={version.status} />
        {version.status !== "draft" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            {version.status === "approved"
              ? "Approved — read-only. Publishing arrives in a later build."
              : "In review — details, content and associations are read-only."}
          </span>
        ) : null}
      </div>

      {submitBlockedByDirty ? (
        <p className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 text-destructive" />
          You have unsaved changes. Save Draft first, then submit for review — Guide Studio never
          submits unsaved content.
        </p>
      ) : null}

      {actions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No workflow actions are available to you for this version.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => {
            const isSubmit = action === "submit_for_review";
            const disabled =
              pending !== null || (isSubmit && dirty) || (action === "request_changes" && false);
            return (
              <Button
                key={action}
                size="sm"
                variant={action === "approve" ? "default" : "outline"}
                disabled={disabled}
                onClick={() => {
                  if (action === "request_changes") {
                    setNoteOpen(true);
                    return;
                  }
                  void run(action);
                }}
              >
                {pending === action ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  ACTION_ICONS[action]
                )}
                {GUIDE_WORKFLOW_ACTION_LABELS[action]}
              </Button>
            );
          })}
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              This returns version {version.versionNumber} to Draft so the author can edit again.
              The optional note is stored on the workflow history — it never changes guide content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="review-note">Review note (optional)</Label>
            <Textarea
              id="review-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Please add more detail to Step 3."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending !== null}
              onClick={() => void run("request_changes", note)}
            >
              {pending === "request_changes" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Undo2 className="size-3.5" />
              )}
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (layout === "inline") return body;

  return (
    <section className="panel p-5">
      <h2 className="label-caps mb-3">Review &amp; approval</h2>
      {body}
    </section>
  );
}
