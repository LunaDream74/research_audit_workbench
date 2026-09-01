from src.schemas import AuditResult, ComparabilityRequest, EvidenceRef, Finding
from src.schemas.contracts import AuditStage, EvidenceLevel, RunSnapshot


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
        kind="source_inconsistency",
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


def audit_comparability(request: ComparabilityRequest) -> AuditResult:
    evidence_a, count_a = _candidate_evidence(request.run_a)
    evidence_b, count_b = _candidate_evidence(request.run_b)
    evidence = [evidence_a, evidence_b]
    findings: list[Finding] = []

    for run in (request.run_a, request.run_b):
        conflict = _source_conflict(run)
        if conflict:
            findings.append(conflict)
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
                kind="comparable_candidate_pool",
                severity="info",
                title="Candidate-pool sizes match",
                summary="No candidate-count mismatch was found; other evaluation conditions remain unchecked.",
                confidence="high" if evidence_a.level == evidence_b.level == EvidenceLevel.RECORDED else "medium",
                evidence_ref_ids=[evidence_a.id, evidence_b.id],
            ),
        )
    else:
        findings.insert(
            0,
            Finding(
                id="candidate-pool-unknown",
                kind="candidate_pool_mismatch",
                severity="warning",
                title="Candidate-pool comparability is unknown",
                summary="At least one run lacks candidate-count evidence, so direct ranking remains unsupported.",
                confidence="low",
                evidence_ref_ids=[evidence_a.id, evidence_b.id],
            ),
        )

    confidence = min((finding.confidence for finding in findings), key=["low", "medium", "high"].index)
    return AuditResult(
        selection_digest=request.selection_digest,
        metrics=[
            {"run_id": request.run_a.id, "name": request.run_a.metric_name, "value": request.run_a.metric_value},
            {"run_id": request.run_b.id, "name": request.run_b.metric_name, "value": request.run_b.metric_value},
        ],
        stages=[
            AuditStage(key="settings", label="Checking evaluation settings"),
            AuditStage(key="manifests", label="Inspecting candidate manifests"),
        ],
        findings=findings,
        evidence_refs=evidence,
        confidence=confidence,
        limitations=[
            "This audit does not estimate how much of the recorded score gap the candidate-pool mismatch caused.",
            "Split, preprocessing, and metric-definition rules are scheduled after the P0 hero path.",
        ],
    )

