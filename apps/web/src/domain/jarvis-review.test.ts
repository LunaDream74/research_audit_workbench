import { describe, expect, it } from "vitest";
import { createResolutionPlan, validatePlan } from "./investigation";
import { reviewInvestigation, type JarvisReviewInput } from "./jarvis-review";

const emptyReview: JarvisReviewInput = {
  pairReady: false,
  auditComplete: false,
  evidenceInspected: false,
  findingSaved: false,
  challengePreviewed: false,
  challengeConfirmed: false,
  planDrafted: false,
  planValidation: null,
  digestReady: false,
  approved: false,
};

describe("JARVIS investigation review", () => {
  it("ranks the next evidence step without claiming human authority", () => {
    const review = reviewInvestigation({
      ...emptyReview,
      pairReady: true,
      auditComplete: true,
    });
    expect(review.score).toBe(30);
    expect(review.nextAction.id).toBe("inspect_evidence");
    expect(review.nextAction.humanRequired).toBe(false);
    expect(review.authorityBoundary).toContain("researcher alone");
  });

  it("stops automation at durable human decisions", () => {
    const review = reviewInvestigation({
      ...emptyReview,
      pairReady: true,
      auditComplete: true,
      evidenceInspected: true,
    });
    expect(review.score).toBe(45);
    expect(review.nextAction.id).toBe("save_finding");
    expect(review.nextAction.humanRequired).toBe(true);
  });

  it("reaches 100 only after a valid exact plan is approved", () => {
    const planValidation = validatePlan(createResolutionPlan());
    const review = reviewInvestigation({
      pairReady: true,
      auditComplete: true,
      evidenceInspected: true,
      findingSaved: true,
      challengePreviewed: true,
      challengeConfirmed: true,
      planDrafted: true,
      planValidation,
      digestReady: true,
      approved: true,
    });
    expect(review.score).toBe(100);
    expect(review.phase).toBe("approved");
    expect(review.nextAction.id).toBe("complete");
  });

  it("prioritizes a decision-relevant plan mismatch", () => {
    const planValidation = validatePlan({ ...createResolutionPlan(), candidatePoolA: 200 });
    const review = reviewInvestigation({
      ...emptyReview,
      pairReady: true,
      auditComplete: true,
      evidenceInspected: true,
      findingSaved: true,
      challengePreviewed: true,
      challengeConfirmed: true,
      planDrafted: true,
      planValidation,
    });
    expect(review.nextAction.id).toBe("fix_plan");
    expect(review.score).toBeLessThan(90);
  });
});
