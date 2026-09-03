import { describe, expect, it } from "vitest";
import { comparisonDigest, primaryFinding, trustedRunSnapshot, type AuditFinding } from "./audit";
describe("trusted audit comparison", () => {
  it("converts only persisted run fields and rejects stale digest inputs", async () => {
    const run = trustedRunSnapshot({ id: "a", name: "Run A", metrics: { name: "Recall@5", value: 0.84 }, config: { declared_candidate_count: 200, evaluation_split: "test" }, source_snapshot: { recorded_candidate_count: 200, source_hashes: { candidate_manifest: "hash" }, injected: "ignored" } });
    expect(run.recorded_candidate_count).toBe(200);
    expect(run).not.toHaveProperty("injected");
    expect(await comparisonDigest("question", [run])).not.toBe(await comparisonDigest("changed", [run]));
  });
  it("selects the highest severity with deterministic condition priority", () => {
    const finding = (kind: string): AuditFinding => ({ id: kind, kind, severity: "critical", title: kind, summary: kind, status: "detected", confidence: "high", evidence_ref_ids: [] });
    expect(primaryFinding([finding("metric_definition_mismatch"), finding("candidate_pool_mismatch")])?.kind).toBe("candidate_pool_mismatch");
  });
});
