export type ChallengePreview = {
  findingId: "candidate-pool-mismatch";
  researcherContext: string;
  previousInterpretation: string;
  proposedInterpretation: string;
  retainedLimitation: string;
  citationIds: string[];
};

export type ResolutionPlan = {
  version: number;
  researchQuestion: string;
  checkpointA: string;
  checkpointB: string;
  candidatePoolA: number;
  candidatePoolB: number;
  evaluationSplit: string;
  preprocessing: string;
  metricDefinition: string;
  batchSize: number;
  decisionThreshold: string;
};

export type PlanValidation = {
  readiness: "ready" | "ready_with_limitation" | "not_ready";
  blockingErrors: string[];
  limitations: string[];
  informationalWarnings: string[];
};

export const originalInterpretation =
  "Run A has the higher recorded score, but the two runs do not establish a direct model ranking under matched conditions.";

export const retainedCandidateLimitation =
  "Run A used 200 candidates and Run B used 1,000; the recorded scores remain unsuitable for direct baseline comparison.";

export function createChallengePreview(researcherContext: string): ChallengePreview {
  const context = researcherContext.trim();
  return {
    findingId: "candidate-pool-mismatch",
    researcherContext: context,
    previousInterpretation: originalInterpretation,
    proposedInterpretation: context.toLowerCase().includes("sanity")
      ? "Valid sanity-check result; unsuitable for direct baseline comparison."
      : "The researcher's context changes the intended use of this result, while the comparison limitation remains.",
    retainedLimitation: retainedCandidateLimitation,
    citationIds: ["run-a:manifest:candidate-count", "run-b:manifest:candidate-count"],
  };
}

export function createResolutionPlan(): ResolutionPlan {
  return {
    version: 1,
    researchQuestion: "Does Run A outperform Run B when both use the same evaluation protocol?",
    checkpointA: "checkpoint://run-a",
    checkpointB: "checkpoint://run-b",
    candidatePoolA: 1000,
    candidatePoolB: 1000,
    evaluationSplit: "test-v1",
    preprocessing: "clip-standard-v1",
    metricDefinition: "Recall@5 · correct target in top 5",
    batchSize: 32,
    decisionThreshold: "At least +3 percentage points with no priority-slice regression",
  };
}

export function validatePlan(plan: ResolutionPlan): PlanValidation {
  const blockingErrors: string[] = [];
  const limitations: string[] = [];
  const informationalWarnings: string[] = [];
  if (!plan.checkpointA || !plan.checkpointB) blockingErrors.push("Both checkpoint references are required.");
  if (plan.batchSize < 1) blockingErrors.push("Batch size must be at least 1.");
  if (plan.candidatePoolA !== plan.candidatePoolB) {
    limitations.push(
      `Candidate pools differ (${plan.candidatePoolA} vs ${plan.candidatePoolB}); this plan cannot support a direct model ranking.`,
    );
  }
  if (plan.batchSize !== 32) {
    informationalWarnings.push("Batch size changed for operational fit; the comparison remains matched.");
  }
  return {
    readiness: blockingErrors.length
      ? "not_ready"
      : limitations.length
        ? "ready_with_limitation"
        : "ready",
    blockingErrors,
    limitations,
    informationalWarnings,
  };
}

export function canonicalPlan(plan: ResolutionPlan): string {
  return JSON.stringify({
    batchSize: plan.batchSize,
    candidatePoolA: plan.candidatePoolA,
    candidatePoolB: plan.candidatePoolB,
    checkpointA: plan.checkpointA,
    checkpointB: plan.checkpointB,
    decisionThreshold: plan.decisionThreshold,
    evaluationSplit: plan.evaluationSplit,
    metricDefinition: plan.metricDefinition,
    preprocessing: plan.preprocessing,
    researchQuestion: plan.researchQuestion,
    version: plan.version,
  });
}

export async function digestPlan(plan: ResolutionPlan): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalPlan(plan));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

