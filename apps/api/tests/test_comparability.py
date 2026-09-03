from fastapi.testclient import TestClient

from app import app
from src.audits import audit_comparability
from src.auth.bearer import require_bearer
from src.schemas import ComparabilityRequest, RunSnapshot


def run(run_id: str, score: float, recorded: int | None, declared: int | None = None, **conditions: str | None) -> RunSnapshot:
    return RunSnapshot(
        id=run_id,
        name=f"Run {run_id.upper()}",
        metric_name="Recall@5",
        metric_value=score,
        recorded_candidate_count=recorded,
        declared_candidate_count=declared or recorded,
        source_hashes={"candidate_manifest": f"hash-{run_id}", "config": f"config-{run_id}"},
        evaluation_split=conditions.get("evaluation_split", "test-v1"),
        preprocessing=conditions.get("preprocessing", "clip-standard-v1"),
        metric_definition=conditions.get("metric_definition", "correct target in top 5"),
    )


def request(run_a: RunSnapshot, run_b: RunSnapshot) -> ComparabilityRequest:
    return ComparabilityRequest(
        selection_digest="selection-a-b",
        question="Does this improvement justify another run?",
        run_a=run_a,
        run_b=run_b,
    )


def test_hero_mismatch_preserves_scores_without_causal_claim() -> None:
    result = audit_comparability(request(run("a", 0.84, 200), run("b", 0.76, 1000)))
    assert [metric["value"] for metric in result.metrics] == [0.84, 0.76]
    finding = result.findings[0]
    assert finding.kind == "candidate_pool_mismatch"
    assert "200" in finding.summary and "1000" in finding.summary
    assert "do not establish a direct model ranking" in finding.summary
    assert "caused" not in finding.summary
    assert any("does not estimate" in item for item in result.limitations)


def test_recorded_inputs_outrank_conflicting_declaration() -> None:
    result = audit_comparability(request(run("a", 0.84, 200, 300), run("b", 0.76, 1000)))
    assert result.findings[0].kind == "candidate_pool_mismatch"
    assert any(finding.kind == "source_conflict" for finding in result.findings)
    assert result.evidence_refs[0].level == "recorded"


def test_missing_manifest_lowers_confidence() -> None:
    result = audit_comparability(request(run("a", 0.84, None, 200), run("b", 0.76, 1000)))
    assert result.findings[0].confidence == "medium"
    assert result.evidence_refs[0].level == "declared"


def test_equal_pool_is_not_full_comparability_claim() -> None:
    result = audit_comparability(request(run("a", 0.84, 1000), run("b", 0.76, 1000)))
    assert result.findings[0].kind == "matched_condition"
    assert len([item for item in result.findings if item.kind == "matched_condition"]) == 4


def test_split_and_metric_mismatches_are_critical_and_preprocessing_is_warning() -> None:
    result = audit_comparability(request(
        run("a", 0.84, 1000, evaluation_split="dev", preprocessing="raw", metric_definition="macro"),
        run("b", 0.76, 1000, evaluation_split="test", preprocessing="normalized", metric_definition="micro"),
    ))
    by_kind = {finding.kind: finding for finding in result.findings}
    assert by_kind["evaluation_split_mismatch"].severity == "critical"
    assert by_kind["metric_definition_mismatch"].severity == "critical"
    assert by_kind["preprocessing_mismatch"].severity == "warning"


def test_missing_condition_evidence_is_explicit_and_lowers_confidence() -> None:
    result = audit_comparability(request(
        run("a", 0.84, 1000, preprocessing=None),
        run("b", 0.76, 1000),
    ))
    missing = next(item for item in result.findings if item.id == "preprocessing-missing-evidence")
    assert missing.kind == "missing_evidence"
    assert missing.confidence == "low"
    assert result.confidence == "low"


def test_recorded_condition_outranks_conflicting_declaration() -> None:
    run_a = run("a", 0.84, 1000, evaluation_split="declared-test")
    run_a.recorded_evaluation_split = "recorded-test"
    result = audit_comparability(request(run_a, run("b", 0.76, 1000, evaluation_split="recorded-test")))
    finding = next(item for item in result.findings if item.id == "a:evaluation_split-source-conflict")
    assert finding.kind == "source_conflict"
    assert "uses the recorded value" in finding.summary


def test_endpoint_requires_bearer() -> None:
    client = TestClient(app)
    response = client.post("/v1/audits/comparability", json=request(run("a", 0.84, 200), run("b", 0.76, 1000)).model_dump())
    assert response.status_code == 401


def test_endpoint_returns_audit() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_bearer] = lambda: "local-test-token"
    try:
        response = client.post(
            "/v1/audits/comparability",
            headers={"Authorization": "Bearer local-test-token"},
            json=request(run("a", 0.84, 200), run("b", 0.76, 1000)).model_dump(),
        )
    finally:
        app.dependency_overrides.pop(require_bearer, None)
    assert response.status_code == 200
    assert response.json()["findings"][0]["id"] == "candidate-pool-mismatch"
