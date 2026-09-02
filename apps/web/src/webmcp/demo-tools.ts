import type { DemoRun } from "@/src/demo/fixture";
import type { ChallengePreview, ResolutionPlan } from "@/src/domain/investigation";
import type { JarvisReview } from "@/src/domain/jarvis-review";
import { toolResult } from "./adapter";
import type { WebMCPTool } from "./types";

export type DemoToolContext = {
  getComparison: () => {
    schemaVersion: "1.0";
    selectionDigest: string;
    question: string;
    runs: readonly DemoRun[];
    evidenceAvailability: string;
  };
  runAudit: (selectionDigest: string, question?: string) => Record<string, unknown>;
  showEvidence?: (findingId: string, evidenceRefIds?: string[]) => Record<string, unknown>;
  stageChallenge?: (findingId: string, researcherContext: string) => ChallengePreview | Record<string, unknown>;
  stagePlan?: (investigationId: string, constraints?: Record<string, unknown>) => ResolutionPlan | Record<string, unknown>;
  reviewReadiness?: () => JarvisReview | Record<string, unknown>;
};

export function buildCoreDemoTools(context: DemoToolContext): WebMCPTool[] {
  return [
    {
      name: "get_current_comparison",
      title: "Inspect the current experiment comparison",
      description: "Read the two runs currently selected by the researcher and the decision question visible on the page. This never changes records.",
      inputSchema: {
        type: "object",
        properties: {
          include: {
            type: "array",
            items: { enum: ["metrics", "configs", "artifact_summaries"] },
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => toolResult(context.getComparison()),
    },
    {
      name: "run_comparability_audit",
      title: "Run a comparability audit",
      description: "Run deterministic checks against the current selected pair. The result is a temporary page preview; it does not create a finding or investigation.",
      inputSchema: {
        type: "object",
        properties: {
          selectionDigest: { type: "string", description: "Digest returned by get_current_comparison." },
          question: { type: "string", description: "Optional decision question." },
        },
        required: ["selectionDigest"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (args) => {
        const selectionDigest = String(args.selectionDigest ?? "");
        if (selectionDigest !== context.getComparison().selectionDigest) {
          return toolResult({ schemaVersion: "1.0", error: "stale_selection", message: "The selected runs changed. Inspect the current comparison again." });
        }
        return toolResult(context.runAudit(selectionDigest, typeof args.question === "string" ? args.question : undefined));
      },
    },
  ];
}

export function buildDemoTools(context: DemoToolContext): WebMCPTool[] {
  return [
    ...buildCoreDemoTools(context),
    {
      name: "show_finding_evidence",
      title: "Show evidence for a comparability finding",
      description: "Open the page's side-by-side source evidence for a temporary or saved finding. This changes only the visible panel.",
      inputSchema: {
        type: "object",
        properties: {
          findingId: { type: "string" },
          evidenceRefIds: { type: "array", items: { type: "string" } },
        },
        required: ["findingId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (args) => toolResult(
        context.showEvidence?.(
          String(args.findingId ?? ""),
          Array.isArray(args.evidenceRefIds) ? args.evidenceRefIds.map(String) : undefined,
        ) ?? { schemaVersion: "1.0", error: "evidence_unavailable" },
      ),
    },
    {
      name: "stage_challenge_revision",
      title: "Preview a revised finding interpretation",
      description: "Stage a reversible interpretation preview using researcher-provided context. A human must confirm before anything enters the investigation history.",
      inputSchema: {
        type: "object",
        properties: {
          findingId: { type: "string" },
          researcherContext: { type: "string", minLength: 1 },
        },
        required: ["findingId", "researcherContext"],
        additionalProperties: false,
      },
      execute: (args) => toolResult({
        schemaVersion: "1.0",
        temporary: true,
        ...(context.stageChallenge?.(String(args.findingId ?? ""), String(args.researcherContext ?? "")) ?? { error: "challenge_unavailable" }),
      }),
    },
    {
      name: "stage_resolution_plan",
      title: "Draft a controlled reevaluation plan",
      description: "Stage an editable reevaluation plan. This does not save or approve the plan and grants no permission to execute experiments.",
      inputSchema: {
        type: "object",
        properties: {
          investigationId: { type: "string" },
          constraints: { type: "object" },
        },
        required: ["investigationId"],
        additionalProperties: false,
      },
      execute: (args) => toolResult({
        schemaVersion: "1.0",
        temporary: true,
        ...(context.stagePlan?.(
          String(args.investigationId ?? ""),
          typeof args.constraints === "object" && args.constraints ? args.constraints as Record<string, unknown> : undefined,
        ) ?? { error: "plan_unavailable" }),
      }),
    },
    {
      name: "review_investigation_readiness",
      title: "Compare the investigation with a defensible decision",
      description: "Review the live evidence, interpretation, and plan state, then rank the highest-value improvements. This is read-only and cannot save, confirm, approve, or execute anything.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => toolResult(
        context.reviewReadiness?.() ?? { schemaVersion: "1.0", error: "review_unavailable" },
      ),
    },
  ];
}
