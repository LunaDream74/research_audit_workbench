export type EvidenceLevel = "recorded" | "declared" | "unknown";

export type TrustedRunSnapshot = {
  id: string;
  name: string;
  metric_name: string;
  metric_value: number;
  declared_candidate_count: number | null;
  recorded_candidate_count: number | null;
  evaluation_split: string | null;
  preprocessing: string | null;
  metric_definition: string | null;
  recorded_evaluation_split: string | null;
  recorded_preprocessing: string | null;
  recorded_metric_definition: string | null;
  source_hashes: Record<string, string>;
};

export type AuditEvidence = {
  id: string;
  run_id: string;
  source_path: string;
  json_pointer: string;
  level: EvidenceLevel;
  label: string;
  observed_value: string | number | null;
  source_hash: string | null;
};

export type AuditFinding = {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  status: "detected";
  confidence: "high" | "medium" | "low";
  evidence_ref_ids: string[];
};

export type AuditResult = {
  schema_version: "1.0";
  selection_digest: string;
  metrics: Array<{ run_id: string; name: string; value: number }>;
  stages: Array<{ key: string; label: string; status: "completed" }>;
  findings: AuditFinding[];
  evidence_refs: AuditEvidence[];
  confidence: "high" | "medium" | "low";
  limitations: string[];
};

type RunRecord = { id: string; name: string; metrics: unknown; config: unknown; source_snapshot: unknown };

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length ? value : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function trustedRunSnapshot(run: RunRecord): TrustedRunSnapshot {
  const metrics = object(run.metrics);
  const config = object(run.config);
  const source = object(run.source_snapshot);
  const hashes = object(source.source_hashes);
  return {
    id: run.id,
    name: run.name,
    metric_name: typeof metrics.name === "string" ? metrics.name : String(source.metric_name ?? "unknown metric"),
    metric_value: typeof metrics.value === "number" ? metrics.value : Number(source.metric_value ?? 0),
    declared_candidate_count: optionalNumber(config.declared_candidate_count ?? source.declared_candidate_count),
    recorded_candidate_count: optionalNumber(source.recorded_candidate_count),
    evaluation_split: optionalString(config.evaluation_split ?? source.evaluation_split),
    preprocessing: optionalString(config.preprocessing ?? source.preprocessing),
    metric_definition: optionalString(config.metric_definition ?? source.metric_definition),
    recorded_evaluation_split: optionalString(source.recorded_evaluation_split),
    recorded_preprocessing: optionalString(source.recorded_preprocessing),
    recorded_metric_definition: optionalString(source.recorded_metric_definition),
    source_hashes: Object.fromEntries(Object.entries(hashes).filter((entry): entry is [string, string] => typeof entry[1] === "string").sort(([left], [right]) => left.localeCompare(right))),
  };
}

export function canonicalComparison(question: string, runs: readonly TrustedRunSnapshot[]): string {
  return JSON.stringify({ question, runs: runs.map((run) => ({
    id: run.id,
    snapshot: run,
  })) });
}

export async function comparisonDigest(question: string, runs: readonly TrustedRunSnapshot[]): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalComparison(question, runs));
  const value = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const FINDING_PRIORITY = [
  "candidate_pool_mismatch",
  "evaluation_split_mismatch",
  "metric_definition_mismatch",
  "preprocessing_mismatch",
  "missing_evidence",
  "source_conflict",
] as const;
const SEVERITY = { critical: 2, warning: 1, info: 0 } as const;

export function primaryFinding(findings: readonly AuditFinding[]): AuditFinding | undefined {
  const priority = (kind: string) => { const index = FINDING_PRIORITY.indexOf(kind as typeof FINDING_PRIORITY[number]); return index < 0 ? FINDING_PRIORITY.length : index; };
  return [...findings].sort((left, right) => SEVERITY[right.severity] - SEVERITY[left.severity] || priority(left.kind) - priority(right.kind))[0];
}
