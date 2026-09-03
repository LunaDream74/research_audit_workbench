from src.schemas import AuditResult, ComparabilityRequest, EvidenceRef, Finding
from src.schemas.contracts import AuditStage, EvidenceLevel, RunSnapshot

CONFIDENCE_ORDER = {"low": 0, "medium": 1, "high": 2}


def _candidate_evidence(run: RunSnapshot) -> tuple[EvidenceRef, int | None]:
    if run.recorded_candidate_count is not None:
        return (
            EvidenceRef(
                id=f"{run.id}:candidate-pool:recorded",
                run_id=run.id,
                source_path=f"{run.id}/candidate_manifest.json",
                json_pointer="/candidate_count",
                level=EvidenceLevel.RECORDED,
                label="Recorded candidate count",
                observed_value=run.recorded_candidate_count,
                source_hash=run.source_hashes.get("candidate_manifest"),
            ),
            run.recorded_candidate_count,
        )
    return (
        EvidenceRef(
            id=f"{run.id}:candidate-pool:declared",
            run_id=run.id,
            source_path=f"{run.id}/config.json",
            json_pointer="/evaluation/candidate_count",
            level=EvidenceLevel.DECLARED if run.declared_candidate_count else EvidenceLevel.UNKNOWN,
            label="Declared candidate count",
            observed_value=run.declared_candidate_count,
            source_hash=run.source_hashes.get("config"),
        ),
        run.declared_candidate_count,
    )


def _source_conflict(run: RunSnapshot) -> Finding | None:
    declared = run.declared_candidate_count
    recorded = run.recorded_candidate_count
    if declared is None or recorded is None or declared == recorded:
        return None
    return Finding(
        id=f"{run.id}:candidate-source-conflict",
        kind="source_conflict",
        severity="warning",
        title=f"{run.name} configuration conflicts with recorded inputs",
        summary=(
            f"The configuration declares {declared} candidates, while the imported manifest "
            f"records {recorded}. The audit uses the recorded input and preserves this disagreement."
        ),
        confidence="high",
        evidence_ref_ids=[
            f"{run.id}:candidate-pool:recorded",
            f"{run.id}:candidate-pool:declared",
        ],
    )


def _condition_evidence(
    run: RunSnapshot,
    key: str,
    declared: str | None,
    recorded: str | None,
) -> tuple[EvidenceRef, str | None]:
    value = recorded if recorded is not None else declared
    level = EvidenceLevel.RECORDED if recorded is not None else (
        EvidenceLevel.DECLARED if declared is not None else EvidenceLevel.UNKNOWN
    )
    source_name = f"{key}_record" if recorded is not None else "config"
    return EvidenceRef(
        id=f"{run.id}:{key}:{level.value}",
        run_id=run.id,
        source_path=f"{run.id}/{'recorded_conditions.json' if recorded is not None else 'config.json'}",
        json_pointer=f"/evaluation/{key}",
        level=level,
        label=f"{key.replace('_', ' ').title()} ({level.value})",
        observed_value=value,
        source_hash=run.source_hashes.get(source_name),
    ), value


def _condition_finding(
    key: str,
    label: str,
    run_a: RunSnapshot,
    run_b: RunSnapshot,
    evidence_a: EvidenceRef,
    value_a: str | int | None,
    evidence_b: EvidenceRef,
    value_b: str | int | None,
    mismatch_kind: str,
    mismatch_severity: str,
) -> Finding:
    refs = [evidence_a.id, evidence_b.id]
    if value_a is None or value_b is None:
        missing = run_a.name if value_a is None else run_b.name
        return Finding(
            id=f"{key}-missing-evidence",
            kind="missing_evidence",
            severity="warning",
            title=f"{label} evidence is incomplete",
            summary=f"{missing} has no {label.lower()} value. Direct ranking remains unsupported until the missing evidence is supplied or retained as a limitation.",
            confidence="low",
            evidence_ref_ids=refs,
        )
    confidence = "high" if evidence_a.level == evidence_b.level == EvidenceLevel.RECORDED else "medium"
    if value_a != value_b:
        return Finding(
            id=f"{key}-mismatch",
            kind=mismatch_kind,
            severity=mismatch_severity,
            title=f"{label}s differ",
            summary=f"{run_a.name} uses {value_a} and {run_b.name} uses {value_b}. The recorded metrics remain valid individually, but this condition does not support a direct model ranking.",
            confidence=confidence,
            evidence_ref_ids=refs,
        )
    return Finding(
        id=f"{key}-matched",
        kind="matched_condition",
        severity="info",
        title=f"{label} matches",
        summary=f"Both runs use {value_a} for {label.lower()}.",
        confidence=confidence,
        evidence_ref_ids=refs,
    )


def _condition_source_conflict(run: RunSnapshot, key: str, declared: str | None, recorded: str | None) -> tuple[Finding, EvidenceRef] | None:
    if declared is None or recorded is None or declared == recorded:
        return None
    declared_evidence = EvidenceRef(
        id=f"{run.id}:{key}:declared",
        run_id=run.id,
        source_path=f"{run.id}/config.json",
        json_pointer=f"/evaluation/{key}",
        level=EvidenceLevel.DECLARED,
        label=f"{key.replace('_', ' ').title()} (declared)",
        observed_value=declared,
        source_hash=run.source_hashes.get("config"),
    )
    return Finding(
        id=f"{run.id}:{key}-source-conflict",
        kind="source_conflict",
        severity="warning",
        title=f"{run.name} {key.replace('_', ' ')} sources conflict",
        summary=f"The configuration declares {declared}, while a recorded source contains {recorded}. The audit uses the recorded value and preserves the disagreement.",
        confidence="high",
        evidence_ref_ids=[f"{run.id}:{key}:recorded", declared_evidence.id],
    ), declared_evidence


def audit_comparability(request: ComparabilityRequest) -> AuditResult:
    evidence_a, count_a = _candidate_evidence(request.run_a)
    evidence_b, count_b = _candidate_evidence(request.run_b)
    evidence = [evidence_a, evidence_b]
    findings: list[Finding] = []
    conflicts: list[Finding] = []

    for run in (request.run_a, request.run_b):
        conflict = _source_conflict(run)
        if conflict:
            conflicts.append(conflict)
            evidence.append(
                EvidenceRef(
                    id=f"{run.id}:candidate-pool:declared",
                    run_id=run.id,
                    source_path=f"{run.id}/config.json",
                    json_pointer="/evaluation/candidate_count",
                    level=EvidenceLevel.DECLARED,
                    label="Declared candidate count",
                    observed_value=run.declared_candidate_count,
                    source_hash=run.source_hashes.get("config"),
                )
            )

    if count_a is not None and count_b is not None and count_a != count_b:
        findings.insert(
            0,
            Finding(
                id="candidate-pool-mismatch",
                kind="candidate_pool_mismatch",
                severity="critical",
                title="Different evaluation conditions",
                summary=(
                    f"{request.run_a.name} used {count_a} candidates and {request.run_b.name} "
                    f"used {count_b}. Both recorded scores remain valid individually, but they do "
                    "not establish a direct model ranking under matched conditions."
                ),
                confidence=(
                    "high"
                    if evidence_a.level == evidence_b.level == EvidenceLevel.RECORDED
                    else "medium"
                ),
                evidence_ref_ids=[evidence_a.id, evidence_b.id],
            ),
        )
    elif count_a is not None and count_b is not None:
        findings.insert(
            0,
            Finding(
                id="candidate-pool-comparable",
                kind="matched_condition",
                severity="info",
                title="Candidate-pool sizes match",
                summary=f"Both runs use {count_a} candidates.",
                confidence="high" if evidence_a.level == evidence_b.level == EvidenceLevel.RECORDED else "medium",
                evidence_ref_ids=[evidence_a.id, evidence_b.id],
            ),
        )
    else:
        findings.insert(
            0,
            Finding(
                id="candidate-pool-unknown",
                kind="missing_evidence",
                severity="warning",
                title="Candidate-pool comparability is unknown",
                summary="At least one run lacks candidate-count evidence, so direct ranking remains unsupported.",
                confidence="low",
                evidence_ref_ids=[evidence_a.id, evidence_b.id],
            ),
        )

    condition_specs = [
        ("evaluation_split", "Evaluation split", "evaluation_split_mismatch", "critical"),
        ("metric_definition", "Metric definition", "metric_definition_mismatch", "critical"),
        ("preprocessing", "Preprocessing", "preprocessing_mismatch", "warning"),
    ]
    condition_findings: list[Finding] = []
    for key, label, kind, severity in condition_specs:
        recorded_key = f"recorded_{key}"
        evidence_a_condition, value_a = _condition_evidence(
            request.run_a, key, getattr(request.run_a, key), getattr(request.run_a, recorded_key)
        )
        evidence_b_condition, value_b = _condition_evidence(
            request.run_b, key, getattr(request.run_b, key), getattr(request.run_b, recorded_key)
        )
        evidence.extend([evidence_a_condition, evidence_b_condition])
        condition_findings.append(_condition_finding(
            key, label, request.run_a, request.run_b,
            evidence_a_condition, value_a, evidence_b_condition, value_b, kind, severity,
        ))
        for run in (request.run_a, request.run_b):
            conflict = _condition_source_conflict(run, key, getattr(run, key), getattr(run, recorded_key))
            if conflict:
                finding, declared_evidence = conflict
                conflicts.append(finding)
                evidence.append(declared_evidence)

    # Decision-relevant findings have stable condition order; missing evidence follows
    # concrete mismatches, and source conflicts are retained last.
    concrete = [item for item in condition_findings if item.kind != "missing_evidence"]
    missing = [item for item in condition_findings if item.kind == "missing_evidence"]
    findings = [findings[0], *concrete, *missing, *conflicts]
    decision_relevant = [finding for finding in findings if finding.severity != "info"]
    confidence_pool = decision_relevant or findings
    confidence = min((finding.confidence for finding in confidence_pool), key=CONFIDENCE_ORDER.get)
    return AuditResult(
        selection_digest=request.selection_digest,
        metrics=[
            {"run_id": request.run_a.id, "name": request.run_a.metric_name, "value": request.run_a.metric_value},
            {"run_id": request.run_b.id, "name": request.run_b.metric_name, "value": request.run_b.metric_value},
        ],
        stages=[
            AuditStage(key="settings", label="Checking evaluation settings"),
            AuditStage(key="manifests", label="Inspecting candidate manifests"),
            AuditStage(key="conditions", label="Comparing split, metric, and preprocessing"),
            AuditStage(key="evidence", label="Checking missing and conflicting evidence"),
        ],
        findings=findings,
        evidence_refs=evidence,
        confidence=confidence,
        limitations=[
            "This audit preserves both metrics and does not estimate how much any mismatch caused the recorded score gap.",
        ],
    )
