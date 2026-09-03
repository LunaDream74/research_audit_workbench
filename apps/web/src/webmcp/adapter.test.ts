import { describe, expect, it, vi } from "vitest";
import { registerWebMCPTools } from "./adapter";
import { buildCoreDemoTools, buildDemoTools, buildHistoryTools } from "./demo-tools";
import type { ModelContext, WebMCPTool } from "./types";

function toolContext() {
  return {
    getComparison: () => ({
      schemaVersion: "1.0" as const,
      selectionDigest: "demo-a-b",
      question: "Does the gain justify another run?",
      runs: [] as const,
      evidenceAvailability: "recorded candidate manifests",
    }),
    runAudit: vi.fn(() => ({ schemaVersion: "1.0", findingId: "candidate-pool-mismatch", temporary: true })),
  };
}

describe("WebMCP adapter", () => {
  it("degrades without changing the manual flow when unsupported", async () => {
    const registration = registerWebMCPTools([], undefined);
    expect(registration.supported).toBe(false);
    await registration.ready;
    registration.abort();
  });

  it("registers tools and aborts the exact registration", async () => {
    const captured: Array<{ tool: WebMCPTool; signal?: AbortSignal }> = [];
    const modelContext: ModelContext = {
      registerTool: vi.fn(async (tool, options) => {
        captured.push({ tool, signal: options?.signal });
      }),
    };
    const registration = registerWebMCPTools(buildCoreDemoTools(toolContext()), modelContext);
    await registration.ready;
    expect(registration.supported).toBe(true);
    expect(captured.map(({ tool }) => tool.name)).toEqual([
      "get_current_comparison",
      "run_comparability_audit",
    ]);
    expect(captured[0].signal?.aborted).toBe(false);
    registration.abort();
    expect(captured[0].signal?.aborted).toBe(true);
  });

  it("rejects an audit requested for a stale pair", async () => {
    const tools = buildCoreDemoTools(toolContext());
    const result = await tools[1].execute({ selectionDigest: "old-pair" });
    expect(result.structuredContent.error).toBe("stale_selection");
  });

  it("exposes seven active tools and three history tools while keeping agent actions reversible", () => {
    const tools = buildDemoTools({
      ...toolContext(),
      showEvidence: vi.fn(() => ({ schemaVersion: "1.0", opened: true })),
      stageChallenge: vi.fn(() => ({ schemaVersion: "1.0", preview: true })),
      stagePlan: vi.fn(() => ({ schemaVersion: "1.0", preview: true })),
      reviewReadiness: vi.fn(() => ({ schemaVersion: "1.0", score: 45, nextAction: { id: "save_finding" } })),
    });
    expect(tools.map((tool) => tool.name)).toEqual([
      "get_current_comparison",
      "run_comparability_audit",
      "show_finding_evidence",
      "stage_challenge_revision",
      "stage_resolution_plan",
      "review_investigation_readiness",
      "get_decision_brief",
    ]);
    expect(tools.map((tool) => tool.name).join(" ")).not.toMatch(/approve|confirm|save|delete|execute_experiment/);
    expect(buildHistoryTools(toolContext()).map((tool) => tool.name)).toEqual([
      "get_current_comparison", "review_investigation_readiness", "get_decision_brief",
    ]);
  });

  it("returns a read-only JARVIS review of the live workflow", async () => {
    const reviewReadiness = vi.fn(() => ({
      schemaVersion: "1.0",
      score: 30,
      nextAction: { id: "inspect_evidence", humanRequired: false },
    }));
    const tools = buildDemoTools({ ...toolContext(), reviewReadiness });
    const reviewTool = tools.find((tool) => tool.name === "review_investigation_readiness");
    expect(reviewTool?.annotations?.readOnlyHint).toBe(true);
    const result = await reviewTool?.execute({});
    expect(result?.structuredContent.score).toBe(30);
    expect(reviewReadiness).toHaveBeenCalledOnce();
  });
});
