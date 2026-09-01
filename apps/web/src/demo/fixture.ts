export type DemoRun = {
  id: "run-a" | "run-b";
  name: string;
  role: string;
  metricName: "Recall@5";
  metricValue: number;
  candidateCount: number;
  manifestId: string;
  manifestHash: string;
};

export const demoQuestion = "Does this apparent improvement justify another training run?";

export const demoRuns: readonly DemoRun[] = [
  {
    id: "run-a",
    name: "Run A",
    role: "New checkpoint · sanity evaluation",
    metricName: "Recall@5",
    metricValue: 0.84,
    candidateCount: 200,
    manifestId: "pool-sanity-200",
    manifestHash: "sha256:run-a-manifest",
  },
  {
    id: "run-b",
    name: "Run B",
    role: "Baseline · full evaluation",
    metricName: "Recall@5",
    metricValue: 0.76,
    candidateCount: 1000,
    manifestId: "pool-baseline-1000",
    manifestHash: "sha256:run-b-manifest",
  },
] as const;

export function selectedPairLabel(selectedIds: readonly string[]): string {
  const selected = demoRuns.filter((run) => selectedIds.includes(run.id));
  return selected.length === 2
    ? `Comparing ${selected[0].name} and ${selected[1].name}`
    : "Select exactly two runs";
}

export function recordedScore(run: DemoRun): string {
  return `${Math.round(run.metricValue * 100)}%`;
}

