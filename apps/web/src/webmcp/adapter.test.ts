import { describe, expect, it, vi } from "vitest";
import { registerWebMCPTools } from "./adapter";
import { buildCoreDemoTools } from "./demo-tools";
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
});

