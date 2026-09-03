import { describe, expect, it } from "vitest";
import {
  createChallengePreview,
  createResolutionPlan,
  digestPlan,
  preparedSampleChallengeSuggestion,
  validatePlan,
} from "./investigation";

describe("human-controlled investigation domain", () => {
  it("accepts research context without erasing the factual limitation", () => {
    const preview = createChallengePreview("The smaller pool was an intentional sanity check.");
    expect(preview.proposedInterpretation).toContain("Valid sanity-check result");
    expect(preview.retainedLimitation).toContain("200 candidates");
    expect(preview.retainedLimitation).toContain("1,000");
  });

  it("retains the selected finding and citations for non-candidate challenges", () => {
    const finding = {
      summary: "Run A is micro-averaged while Run B is macro-averaged.",
      evidence_ref_ids: ["run-a:metric", "run-b:metric"],
    };
    const preview = createChallengePreview("Aggregation differs by design.", "metric-definition-mismatch", finding);
    expect(preview.retainedLimitation).toBe(finding.summary);
    expect(preview.citationIds).toEqual(finding.evidence_ref_ids);
  });

  it("offers guided context only for the two exact prepared samples", () => {
    const base = { metric_name: "Recall@5", evaluation_split: "test-v1", preprocessing: "clip-standard-v1", metric_definition: "correct target in top 5" };
    expect(preparedSampleChallengeSuggestion([
      { ...base, recorded_candidate_count: 200 },
      { ...base, recorded_candidate_count: 1000 },
    ])).toContain("intentional sanity check");
    expect(preparedSampleChallengeSuggestion([
      { ...base, recorded_candidate_count: 500 },
      { ...base, recorded_candidate_count: 1000 },
    ])).toBeNull();
  });

  it("treats batch size as operational and a one-sided pool edit as decision-relevant", () => {
    const operational = { ...createResolutionPlan(), batchSize: 16 };
    expect(validatePlan(operational).readiness).toBe("ready");
    expect(validatePlan(operational).informationalWarnings).toHaveLength(1);
    const mismatched = { ...operational, candidatePoolA: 200 };
    expect(validatePlan(mismatched).readiness).toBe("not_ready");
    const carried = { ...mismatched, approvalLimitations: ["Candidate pool remains intentionally unmatched."] };
    expect(validatePlan(carried).readiness).toBe("ready_with_limitation");
    expect(validatePlan(carried).limitations[0]).toContain("intentionally unmatched");
  });

  it("binds the digest to the exact plan body", async () => {
    const plan = createResolutionPlan();
    const changed = { ...plan, batchSize: 16 };
    expect(await digestPlan(plan)).toHaveLength(64);
    expect(await digestPlan(plan)).not.toBe(await digestPlan(changed));
  });
});
