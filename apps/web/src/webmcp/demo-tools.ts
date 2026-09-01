import type { DemoRun } from "@/src/demo/fixture";
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

