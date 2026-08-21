import { validateGuideAssociations } from "@/domain/association-rules";
import { guideProvidesAuthoringCoverage, guideProvidesPublishedCoverage } from "@/domain/guide-lifecycle";
import { seedGuideVersions, seedGuides } from "@/data/seed/guides";
import { mockGuideStudioProvider } from "@/providers/mock/guide-studio.mock";
import { refKey } from "@/domain/external-ref";

const v = (status: any, id = "v") => ({ id, guideId: "g", versionNumber: "1.0", status, createdAt: "", createdBy: "", updatedAt: "", updatedBy: "", publishedAt: null }) as any;

console.log("archived current + older draft authoring:", guideProvidesAuthoringCoverage([v("archived","a"), v("draft","b")]));
console.log("published v1.0 + draft current -> published:", guideProvidesPublishedCoverage([v("published","a"), v("draft","b")]), "authoring:", guideProvidesAuthoringCoverage([v("published","a"), v("draft","b")]));
console.log("archived only -> authoring:", guideProvidesAuthoringCoverage([v("archived","a")]), "published:", guideProvidesPublishedCoverage([v("archived","a")]));

const facts = await mockGuideStudioProvider.getCoverageFacts();
const find = (k: string) => facts.find((f) => refKey(f.ref) === k);
console.log("feature-manage-employee-roles (draft current, published history):", JSON.stringify(find("devharmony::feature::feature-manage-employee-roles")));
console.log("feature-delete-deal (archived current, approved history):", JSON.stringify(find("devharmony::feature::feature-delete-deal")));

// invalid source/kind seed
try {
  validateGuideAssociations([{ ...seedGuides[0]!, associations: [{ id: "x", guideId: seedGuides[0]!.id, ref: { source: "devharmony", kind: "intent", externalId: "i" } as any, label: "bad" }] }]);
  console.log("INVALID KIND: NOT CAUGHT");
} catch (e: any) { console.log("invalid kind caught:", e.name); }

// duplicate seed
try {
  const a = { id: "x", guideId: seedGuides[0]!.id, ref: { source: "devharmony", kind: "feature", externalId: "f1" } as any, label: "dup" };
  validateGuideAssociations([{ ...seedGuides[0]!, associations: [a, { ...a, id: "y" }] }]);
  console.log("DUPLICATE: NOT CAUGHT");
} catch (e: any) { console.log("duplicate caught:", e.name); }

// runtime duplicate
try {
  const g = seedGuides[0]!;
  const existing = g.associations[0]!;
  await mockGuideStudioProvider.createAssociation({ guideId: g.id, ref: existing.ref as any, label: "dup" });
  console.log("RUNTIME DUP: NOT CAUGHT");
} catch (e: any) { console.log("runtime duplicate caught:", e.name); }
try {
  await mockGuideStudioProvider.createAssociation({ guideId: seedGuides[0]!.id, ref: { source: "ai-studio", kind: "feature", externalId: "z" } as any, label: "bad" });
  console.log("RUNTIME KIND: NOT CAUGHT");
} catch (e: any) { console.log("runtime invalid kind caught:", e.name); }
console.log("seed versions:", seedGuideVersions.length, "seed guides:", seedGuides.length);
