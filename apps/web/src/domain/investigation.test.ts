import { describe, expect, it } from "vitest";
import {
  createChallengePreview,
  createResolutionPlan,
  digestPlan,
  validatePlan,
} from "./investigation";

describe("human-controlled investigation domain", () => {
  it("accepts research context without erasing the factual limitation", () => {
    const preview = createChallengePreview("The smaller pool was an intentional sanity check.");
    expect(preview.proposedInterpretation).toContain("Valid sanity-check result");
    expect(preview.retainedLimitation).toContain("200 candidates");
    expect(preview.retainedLimitation).toContain("1,000");
  });

  it("treats batch size as operational and a one-sided pool edit as decision-relevant", () => {
    const operational = { ...createResolutionPlan(), batchSize: 16 };
    expect(validatePlan(operational).readiness).toBe("ready");
    expect(validatePlan(operational).informationalWarnings).toHaveLength(1);
    const mismatched = { ...operational, candidatePoolA: 200 };
    expect(validatePlan(mismatched).readiness).toBe("ready_with_limitation");
    expect(validatePlan(mismatched).limitations[0]).toContain("cannot support a direct model ranking");
  });

  it("binds the digest to the exact plan body", async () => {
    const plan = createResolutionPlan();
    const changed = { ...plan, batchSize: 16 };
    expect(await digestPlan(plan)).toHaveLength(64);
    expect(await digestPlan(plan)).not.toBe(await digestPlan(changed));
  });
});

