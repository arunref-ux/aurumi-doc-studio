import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthorization } from "@/auth/AuthorizationContext";
import {
  AssociationPicker,
  type AssociationDraft,
} from "@/components/studio/AssociationPicker";
import { PageHeader } from "@/components/studio/PageHeader";
import { SourceChip } from "@/components/studio/SourceChip";
import { StatusBadge } from "@/components/studio/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { guideCommands } from "@/commands/guide-commands";
import { useGuideCommand } from "@/commands/useGuideCommand";
import { REFERENCE_KIND_LABELS, refKey } from "@/domain/external-ref";
import { INITIAL_VERSION_NUMBER } from "@/domain/guide-editing";
import {
  GUIDE_TYPE_LABELS,
  type GuideType,
  type GuideWithVersion,
} from "@/domain/types";

/**
 * Guide authoring workspace (Build 2A.1).
 *
 * Editable surface when editing a draft: Title, Summary and Associations only.
 * Guide type is chosen once at creation and is read-only afterwards — the
 * update command/provider contract does not accept it at all.
 *
 * Every write leaves through the command bus, which authorizes the action
 * centrally before the Guide Studio provider is reached. Version number and
 * workflow status are system-controlled and displayed read-only.
 */

type SaveState = "idle" | "saving" | "saved" | "error";

interface Draft {
  title: string;
  summary: string;
  guideType: GuideType;
  associations: AssociationDraft[];
}

function draftFromGuide(guide: GuideWithVersion): Draft {
  return {
    title: guide.title,
    summary: guide.summary,
    guideType: guide.guideType,
    associations: guide.associations.map((association) => ({
      ref: association.ref,
      label: association.label,
      ...(association.parentExternalId
        ? { parentExternalId: association.parentExternalId }
        : {}),
    })),
  };
}

const EMPTY_DRAFT: Draft = {
  title: "",
  summary: "",
  guideType: "how-to",
  associations: [],
};

export function GuideWorkspace({ guide }: { guide?: GuideWithVersion }) {
  const mode = guide ? "edit" : "create";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthorization();

  const createGuide = useGuideCommand(guideCommands.createGuide);
  const updateGuideDraft = useGuideCommand(guideCommands.updateGuideDraft);

  const baseline = useMemo<Draft>(() => (guide ? draftFromGuide(guide) : EMPTY_DRAFT), [guide]);
  const [draft, setDraft] = useState<Draft>(baseline);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(baseline);
  }, [baseline]);

  const dirty = useMemo(
    () =>
      saveState !== "saving" &&
      saveState !== "saved" &&
      JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline, saveState],
  );

  /**
   * One guard for every exit path: router navigation (sidebar, Guide Library,
   * another guide, any internal route change, browser back/forward) plus
   * browser/tab unload. The workspace Back control routes through the same
   * mechanism because it is an ordinary navigation.
   */
  const guard = useDirtyNavigationGuard(dirty);

  const leave = useCallback(() => {
    void navigate(
      guide ? { to: "/library/$guideId", params: { guideId: guide.id } } : { to: "/library" },
    );
  }, [guide, navigate]);

  const existingKeys = draft.associations.map((association) => refKey(association.ref));

  const addDraftAssociation = (association: AssociationDraft) => {
    setSaveState("idle");
    setDraft((current) =>
      existingKeys.includes(refKey(association.ref))
        ? current
        : { ...current, associations: [...current.associations, association] },
    );
  };

  const removeDraftAssociation = (key: string) => {
    setSaveState("idle");
    setDraft((current) => ({
      ...current,
      associations: current.associations.filter(
        (association) => refKey(association.ref) !== key,
      ),
    }));
  };

  const save = async () => {
    setSaveState("saving");
    setError(null);
    const actor = user?.name ?? "Unknown user";

    try {
      if (!guide) {
        // Creation is one logical operation: Guide + GuideVersion 1.0 / Draft.
        const created = await createGuide({
          title: draft.title,
          summary: draft.summary,
          guideType: draft.guideType,
          actor,
          associations: draft.associations,
        });
        await queryClient.invalidateQueries();
        setSaveState("saved");
        await navigate({ to: "/library/edit/$guideId", params: { guideId: created.id } });
        return;
      }

      // One logical mutation: metadata + the complete association set are
      // validated together and committed atomically by the provider. No
      // per-association calls, so no partially applied edit is possible and no
      // UI-level rollback is needed. guideType is not part of this payload.
      await updateGuideDraft({
        guideId: guide.id,
        title: draft.title,
        summary: draft.summary,
        actor,
        associations: draft.associations,
      });

      await queryClient.invalidateQueries();
      setSaveState("saved");
    } catch (caught) {
      setSaveState("error");
      setError(caught instanceof Error ? caught.message : "Unable to save this guide.");
    }
  };

  const titleMissing = draft.title.trim().length === 0;

  return (
    <div className="space-y-5">
      <button
        onClick={leave}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {guide ? "Back to Guide" : "Back to Guide Library"}
      </button>

      <PageHeader
        eyebrow="Guide Studio"
        title={mode === "create" ? "Create New Guide" : `Edit Draft — ${guide!.title}`}
        description="Guide metadata and source associations. Version and workflow status are owned by the GuideVersion record."
        actions={
          <div className="flex items-center gap-3">
            <SaveIndicator state={saveState} dirty={dirty} />
            <Button size="sm" onClick={() => void save()} disabled={titleMissing || saveState === "saving"}>
              {saveState === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save Draft
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="panel flex items-start gap-2 border-destructive/40 p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 text-destructive" />
          <div>
            <p className="font-medium">Unable to Save</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="associations">
            Associations ({draft.associations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <section className="panel space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="guide-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guide-title"
                  value={draft.title}
                  onChange={(event) => {
                    setSaveState("idle");
                    setDraft({ ...draft, title: event.target.value });
                  }}
                  placeholder="How to Create a Deal"
                />
                {titleMissing ? (
                  <p className="text-xs text-muted-foreground">A title is required to save.</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guide-summary">Summary / Description</Label>
                <Textarea
                  id="guide-summary"
                  rows={4}
                  value={draft.summary}
                  onChange={(event) => {
                    setSaveState("idle");
                    setDraft({ ...draft, summary: event.target.value });
                  }}
                  placeholder="What the reader will be able to do after following this guide."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Guide type</Label>
                <Select
                  value={draft.guideType}
                  onValueChange={(value) => {
                    setSaveState("idle");
                    setDraft({ ...draft, guideType: value as GuideType });
                  }}
                >
                  <SelectTrigger className="h-9 w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GUIDE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="panel h-fit p-5">
              <h2 className="label-caps mb-3">System controlled</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="font-mono">
                    v{guide ? guide.currentVersion.versionNumber : INITIAL_VERSION_NUMBER}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={guide ? guide.currentVersion.status : "draft"} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd>{guide ? guide.owner : (user?.name ?? "—")}</dd>
                </div>
              </dl>
              <p className="mt-4 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                The initial version number and workflow status are assigned by Guide Studio. A new
                guide always starts as v{INITIAL_VERSION_NUMBER} / Draft.
              </p>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <section className="panel p-8 text-center">
            <p className="text-sm font-medium">Content authoring is not available yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              Rich content authoring will be added in the next build (Build 2A.2 — Rich Content
              Authoring and Markdown Canonical Representation).
            </p>
          </section>
        </TabsContent>

        <TabsContent value="associations" className="mt-4">
          <section className="panel">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Associations</h2>
                <p className="text-xs text-muted-foreground">
                  Normalized composite references (source · kind · externalId). Source systems stay
                  the owners of these entities.
                </p>
              </div>
              <AssociationPicker onAdd={addDraftAssociation} existingKeys={existingKeys} />
            </div>

            {draft.associations.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No associations yet. Add at least one so this guide can contribute to coverage.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {draft.associations.map((association) => {
                  const key = refKey(association.ref);
                  return (
                    <li key={key} className="flex items-center gap-3 px-4 py-2.5">
                      <SourceChip source={association.ref.source} />
                      <span className="label-caps">
                        {REFERENCE_KIND_LABELS[association.ref.kind]}
                      </span>
                      <span className="text-sm font-medium">{association.label}</span>
                      <span className="font-mono text-[0.625rem] text-muted-foreground">
                        {association.ref.externalId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-destructive"
                        onClick={() => removeDraftAssociation(key)}
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaveIndicator({ state, dirty }: { state: SaveState; dirty: boolean }) {
  if (state === "saving") {
    return <span className="text-xs text-muted-foreground">Saving…</span>;
  }
  if (state === "error") {
    return <span className="text-xs text-destructive">Unable to Save</span>;
  }
  if (state === "saved" && !dirty) {
    return <span className="text-xs text-muted-foreground">Saved</span>;
  }
  if (dirty) {
    return <span className="text-xs text-muted-foreground">Unsaved changes</span>;
  }
  return null;
}
