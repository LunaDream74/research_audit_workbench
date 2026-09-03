from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class EvidenceLevel(StrEnum):
    RECORDED = "recorded"
    DECLARED = "declared"
    UNKNOWN = "unknown"


class RunSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    metric_name: str
    metric_value: float = Field(ge=0)
    declared_candidate_count: int | None = Field(default=None, gt=0)
    recorded_candidate_count: int | None = Field(default=None, gt=0)
    evaluation_split: str | None = None
    preprocessing: str | None = None
    metric_definition: str | None = None
    recorded_evaluation_split: str | None = None
    recorded_preprocessing: str | None = None
    recorded_metric_definition: str | None = None
    source_hashes: dict[str, str] = Field(default_factory=dict)


class ComparabilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selection_digest: str = Field(min_length=8)
    question: str = Field(min_length=1, max_length=500)
    run_a: RunSnapshot
    run_b: RunSnapshot


class EvidenceRef(BaseModel):
    id: str
    run_id: str
    source_path: str
    json_pointer: str
    level: EvidenceLevel
    label: str
    observed_value: int | float | str | None
    source_hash: str | None = None


class Finding(BaseModel):
    id: str
    kind: Literal[
        "candidate_pool_mismatch",
        "evaluation_split_mismatch",
        "preprocessing_mismatch",
        "metric_definition_mismatch",
        "missing_evidence",
        "matched_condition",
        "source_conflict",
    ]
    severity: Literal["info", "warning", "critical"]
    title: str
    summary: str
    status: Literal["detected"] = "detected"
    confidence: Literal["high", "medium", "low"]
    evidence_ref_ids: list[str]


class AuditStage(BaseModel):
    key: str
    label: str
    status: Literal["completed"] = "completed"


class AuditResult(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    selection_digest: str
    metrics: list[dict[str, str | float]]
    stages: list[AuditStage]
    findings: list[Finding]
    evidence_refs: list[EvidenceRef]
    confidence: Literal["high", "medium", "low"]
    limitations: list[str]


class PreviewFile(BaseModel):
    path: str
    sha256: str
    kind: str
    proposed_run_id: str | None = None


class ImportPreview(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    preview_id: str
    digest: str
    files: list[PreviewFile]
    proposed_experiment: dict[str, Any]
    proposed_runs: list[RunSnapshot]
    proposed_artifacts: list[dict[str, Any]]
    warnings: list[str]
    audit_readiness: dict[str, str]


class ResolutionPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1)
    research_question: str = Field(min_length=1)
    fixed_variables: dict[str, str | int | float]
    changed_variables: dict[str, str | int | float]
    required_artifacts: list[str]
    missing_inputs: list[str] = Field(default_factory=list)
    resource_constraints: dict[str, str | int | float] = Field(default_factory=dict)
    decision_threshold: str


class PlanValidationRequest(BaseModel):
    investigation_snapshot: dict[str, Any]
    plan: ResolutionPlan


class PlanValidationResult(BaseModel):
    canonical_plan: ResolutionPlan
    digest: str
    readiness: Literal["ready", "not_ready", "ready_with_limitation"]
    blocking_errors: list[str]
    limitations: list[str]
    informational_warnings: list[str]
