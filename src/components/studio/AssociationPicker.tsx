import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
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
import { REFERENCE_KIND_LABELS, SOURCE_LABELS } from "@/domain/external-ref";
import { guideRef } from "@/domain/external-ref";
import type { GuideReferenceTarget } from "@/domain/types";
import { aiStudioQueries, connectorQueries, devHarmonyQueries } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Association picker.
 *
 * Reads external hierarchies exclusively through the provider-backed queries —
 * never from seed data — and loads children only after a parent is selected, so
 * the existing lazy-loading contract is preserved. Validation is NOT duplicated
 * here: the domain/provider boundary stays authoritative.
 */

export interface AssociationDraft {
  ref: GuideReferenceTarget;
  label: string;
  parentExternalId?: string;
}

type PickerSource = "devharmony" | "ai-studio" | "connector";

const SOURCE_CONFIG: Record<
  PickerSource,
  { parentKind: "app" | "topic" | "connector"; childKind: "feature" | "intent" | "capability" }
> = {
  devharmony: { parentKind: "app", childKind: "feature" },
  "ai-studio": { parentKind: "topic", childKind: "intent" },
  connector: { parentKind: "connector", childKind: "capability" },
};

export function AssociationPicker({
  onAdd,
  disabled,
  existingKeys,
}: {
  onAdd: (draft: AssociationDraft) => void;
  disabled?: boolean;
  existingKeys: string[];
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<PickerSource>("devharmony");
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string>("");
  const [childId, setChildId] = useState<string | null>(null);
  const [childLabel, setChildLabel] = useState<string>("");

  const config = SOURCE_CONFIG[source];

  // Top-level lists: one lazy query per source, only the active one is enabled.
  const apps = useQuery({ ...devHarmonyQueries.apps(), enabled: open && source === "devharmony" });
  const topics = useQuery({ ...aiStudioQueries.topics(), enabled: open && source === "ai-studio" });
  const connectors = useQuery({
    ...connectorQueries.connectors(),
    enabled: open && source === "connector",
  });

  // Children load only after a parent is chosen.
  const features = useQuery(devHarmonyQueries.features(source === "devharmony" ? parentId : null));
  const intents = useQuery(aiStudioQueries.intents(source === "ai-studio" ? parentId : null));
  const capabilities = useQuery(
    connectorQueries.capabilities(source === "connector" ? parentId : null),
  );

  const parentQuery =
    source === "devharmony" ? apps : source === "ai-studio" ? topics : connectors;
  const childQuery =
    source === "devharmony" ? features : source === "ai-studio" ? intents : capabilities;

  const parentItems = (parentQuery.data ?? []).map((item) => ({
    externalId: item.externalId,
    name: item.name,
  }));
  const childItems = (childQuery.data ?? []).map((item) => ({
    externalId: item.externalId,
    name: item.name,
  }));

  const resetSelection = () => {
    setParentId(null);
    setParentLabel("");
    setChildId(null);
    setChildLabel("");
  };

  const selectSource = (next: PickerSource) => {
    setSource(next);
    resetSelection();
  };

  const canAdd = Boolean(parentId);

  const submit = () => {
    if (!parentId) return;
    if (childId) {
      onAdd({
        ref: guideRef(source, config.childKind, childId),
        label: childLabel,
        parentExternalId: parentId,
      });
    } else {
      onAdd({ ref: guideRef(source, config.parentKind, parentId), label: parentLabel });
    }
    resetSelection();
    setOpen(false);
  };

  const keyOf = (kind: string, externalId: string) => `${source}::${kind}::${externalId}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetSelection();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Plus className="size-3.5" /> Add Association
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add association</DialogTitle>
          <DialogDescription>
            Pick a source system, then a top-level entity. Selecting a child entity is optional —
            children load only when requested.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SOURCE_CONFIG) as PickerSource[]).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={source === item ? "default" : "outline"}
                onClick={() => selectSource(item)}
              >
                {SOURCE_LABELS[item]}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EntityList
              title={REFERENCE_KIND_LABELS[config.parentKind]}
              loading={parentQuery.isPending && parentQuery.fetchStatus !== "idle"}
              error={parentQuery.isError ? (parentQuery.error as Error).message : null}
              onRetry={() => parentQuery.refetch()}
              items={parentItems}
              selectedId={parentId}
              disabledKeys={existingKeys}
              keyOf={(id) => keyOf(config.parentKind, id)}
              onSelect={(item) => {
                setParentId(item.externalId);
                setParentLabel(item.name);
                setChildId(null);
                setChildLabel("");
              }}
            />
            <EntityList
              title={`${REFERENCE_KIND_LABELS[config.childKind]} (optional)`}
              placeholder={
                parentId
                  ? undefined
                  : `Select a ${REFERENCE_KIND_LABELS[config.parentKind].toLowerCase()} first`
              }
              loading={Boolean(parentId) && childQuery.isPending}
              error={childQuery.isError ? (childQuery.error as Error).message : null}
              onRetry={() => childQuery.refetch()}
              items={parentId ? childItems : []}
              selectedId={childId}
              disabledKeys={existingKeys}
              keyOf={(id) => keyOf(config.childKind, id)}
              onSelect={(item) => {
                setChildId(item.externalId === childId ? null : item.externalId);
                setChildLabel(item.name);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canAdd} onClick={submit}>
            Add association
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntityList({
  title,
  items,
  loading,
  error,
  onRetry,
  selectedId,
  onSelect,
  placeholder,
  disabledKeys,
  keyOf,
}: {
  title: string;
  items: { externalId: string; name: string }[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedId: string | null;
  onSelect: (item: { externalId: string; name: string }) => void;
  placeholder?: string;
  disabledKeys: string[];
  keyOf: (externalId: string) => string;
}) {
  return (
    <div className="rounded-md border border-border">
      <p className="label-caps border-b border-border px-3 py-2">{title}</p>
      <div className="max-h-64 overflow-y-auto p-1.5">
        {placeholder ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">{placeholder}</p>
        ) : error ? (
          <button onClick={onRetry} className="px-2 py-3 text-xs text-destructive hover:underline">
            {error} — retry
          </button>
        ) : loading ? (
          <p className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">Nothing available.</p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => {
              const alreadyAssociated = disabledKeys.includes(keyOf(item.externalId));
              const selected = selectedId === item.externalId;
              return (
                <li key={item.externalId}>
                  <button
                    type="button"
                    disabled={alreadyAssociated}
                    onClick={() => onSelect(item)}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors",
                      selected ? "bg-accent font-medium" : "hover:bg-accent/60",
                      alreadyAssociated && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    {alreadyAssociated ? (
                      <span className="text-[0.625rem] text-muted-foreground">Associated</span>
                    ) : selected ? (
                      <Check className="size-3.5" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
