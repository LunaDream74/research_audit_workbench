export type ChallengePreview = { findingId: string; researcherContext: string; previousInterpretation: string; proposedInterpretation: string; retainedLimitation: string; citationIds: string[] };
export type ResolutionPlan = {
  version: number; researchQuestion: string; checkpointA: string; checkpointB: string;
  candidatePoolA: number; candidatePoolB: number; evaluationSplitA: string; evaluationSplitB: string;
  preprocessingA: string; preprocessingB: string; metricDefinitionA: string; metricDefinitionB: string;
  batchSize: number; decisionThreshold: string; approvalLimitations: string[];
};
export type PlanValidation = { readiness: "ready" | "ready_with_limitation" | "not_ready"; blockingErrors: string[]; limitations: string[]; informationalWarnings: string[] };

export const originalInterpretation = "Run A has the higher recorded score, but the two runs do not establish a direct model ranking under matched conditions.";
export const retainedCandidateLimitation = "Run A used 200 candidates and Run B used 1,000; the recorded scores remain unsuitable for direct baseline comparison.";

type ChallengeFinding = { summary: string; evidence_ref_ids: string[] };
type SuggestionRun = {
  metric_name: string;
  recorded_candidate_count: number | null;
  evaluation_split: string | null;
  preprocessing: string | null;
  metric_definition: string | null;
};

export function preparedSampleChallengeSuggestion(runs: readonly SuggestionRun[]): string | null {
  if (runs.length !== 2) return null;
  const [runA, runB] = runs;
  const candidateSample = runA.metric_name === "Recall@5" && runB.metric_name === "Recall@5"
    && runA.recorded_candidate_count === 200 && runB.recorded_candidate_count === 1000
    && runA.evaluation_split === "test-v1" && runB.evaluation_split === "test-v1"
    && runA.preprocessing === "clip-standard-v1" && runB.preprocessing === "clip-standard-v1";
  if (candidateSample) return "Run A used a smaller candidate pool as an intentional sanity check. Preserve its score for that limited purpose, but do not treat it as evidence that Run A outperforms Run B.";

  const metricSample = runA.metric_name === "nDCG@10" && runB.metric_name === "nDCG@10"
    && runA.recorded_candidate_count === 1000 && runB.recorded_candidate_count === 1000
    && runA.evaluation_split === "evaluation-v2" && runB.evaluation_split === "evaluation-v2"
    && runA.preprocessing === "embedding-l2-v1" && runB.preprocessing === "embedding-l2-v1"
    && runA.metric_definition === "nDCG@10 micro-averaged across all queries"
    && runB.metric_definition === "nDCG@10 macro-averaged across query cohorts";
  if (metricSample) return "These reports used different aggregation definitions: Run A is micro-averaged and Run B is macro-averaged. Preserve both scores, but do not rank the runs until they are reevaluated under one shared metric definition.";

  return null;
}

export function createChallengePreview(researcherContext: string, findingId = "candidate-pool-mismatch", finding?: ChallengeFinding): ChallengePreview {
  const context = researcherContext.trim();
  return { findingId, researcherContext: context, previousInterpretation: originalInterpretation,
    proposedInterpretation: context.toLowerCase().includes("sanity") ? "Valid sanity-check result; unsuitable for direct baseline comparison." : "The researcher's context changes the intended use of this result, while the comparison limitation remains.",
    retainedLimitation: finding?.summary ?? retainedCandidateLimitation,
    citationIds: finding?.evidence_ref_ids ?? ["run-a:candidate_pool:recorded", "run-b:candidate_pool:recorded"] };
}

export type PlanBaseline = { candidatePool?: number | null; evaluationSplit?: string | null; preprocessing?: string | null; metricDefinition?: string | null };
export function createResolutionPlan(baseline: PlanBaseline = {}): ResolutionPlan {
  return { version: 1, researchQuestion: "Does Run A outperform Run B when both use the same evaluation protocol?",
    checkpointA: "checkpoint://run-a", checkpointB: "checkpoint://run-b",
    candidatePoolA: baseline.candidatePool ?? 1000, candidatePoolB: baseline.candidatePool ?? 1000,
    evaluationSplitA: baseline.evaluationSplit ?? "test-v1", evaluationSplitB: baseline.evaluationSplit ?? "test-v1",
    preprocessingA: baseline.preprocessing ?? "clip-standard-v1", preprocessingB: baseline.preprocessing ?? "clip-standard-v1",
    metricDefinitionA: baseline.metricDefinition ?? "Recall@5 - correct target in top 5", metricDefinitionB: baseline.metricDefinition ?? "Recall@5 - correct target in top 5",
    batchSize: 32, decisionThreshold: "At least +3 percentage points with no priority-slice regression", approvalLimitations: [] };
}

export function validatePlan(plan: ResolutionPlan): PlanValidation {
  const blockingErrors: string[] = [], limitations: string[] = [], informationalWarnings: string[] = [];
  if (!plan.checkpointA || !plan.checkpointB) blockingErrors.push("Both checkpoint references are required.");
  if (plan.batchSize < 1) blockingErrors.push("Batch size must be at least 1.");
  if (!plan.evaluationSplitA || !plan.evaluationSplitB || !plan.preprocessingA || !plan.preprocessingB || !plan.metricDefinitionA || !plan.metricDefinitionB) blockingErrors.push("Split, preprocessing, and metric definition are required for both runs.");
  const critical = [
    plan.candidatePoolA !== plan.candidatePoolB ? `candidate pool (${plan.candidatePoolA} vs ${plan.candidatePoolB})` : null,
    plan.evaluationSplitA !== plan.evaluationSplitB ? `evaluation split (${plan.evaluationSplitA} vs ${plan.evaluationSplitB})` : null,
    plan.metricDefinitionA !== plan.metricDefinitionB ? `metric definition (${plan.metricDefinitionA} vs ${plan.metricDefinitionB})` : null,
  ].filter((item): item is string => Boolean(item));
  for (const mismatch of critical) {
    const condition = mismatch.split(" (")[0];
    const named = plan.approvalLimitations?.find((item) => item.toLowerCase().includes(condition));
    if (named) limitations.push(named); else blockingErrors.push(`The critical ${mismatch} mismatch must be resolved or named in approval limitations.`);
  }
  if (plan.preprocessingA !== plan.preprocessingB) limitations.push(`Preprocessing differs (${plan.preprocessingA} vs ${plan.preprocessingB}); interpretation must retain this warning.`);
  if (plan.batchSize !== 32) informationalWarnings.push("Batch size changed for operational fit; the comparison remains matched.");
  return { readiness: blockingErrors.length ? "not_ready" : limitations.length ? "ready_with_limitation" : "ready", blockingErrors, limitations, informationalWarnings };
}

export function canonicalPlan(plan: ResolutionPlan): string {
  return JSON.stringify({ approvalLimitations: plan.approvalLimitations, batchSize: plan.batchSize, candidatePoolA: plan.candidatePoolA,
    candidatePoolB: plan.candidatePoolB, checkpointA: plan.checkpointA, checkpointB: plan.checkpointB, decisionThreshold: plan.decisionThreshold,
    evaluationSplitA: plan.evaluationSplitA, evaluationSplitB: plan.evaluationSplitB, metricDefinitionA: plan.metricDefinitionA,
    metricDefinitionB: plan.metricDefinitionB, preprocessingA: plan.preprocessingA, preprocessingB: plan.preprocessingB,
    researchQuestion: plan.researchQuestion, version: plan.version });
}
export async function digestPlan(plan: ResolutionPlan): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPlan(plan)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
