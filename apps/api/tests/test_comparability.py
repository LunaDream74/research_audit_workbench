from fastapi.testclient import TestClient

from app import app
from src.audits import audit_comparability
from src.schemas import ComparabilityRequest, RunSnapshot


def run(run_id: str, score: float, recorded: int | None, declared: int | None = None) -> RunSnapshot:
    return RunSnapshot(
        id=run_id,
        name=f"Run {run_id.upper()}",
        metric_name="Recall@5",
        metric_value=score,
        recorded_candidate_count=recorded,
        declared_candidate_count=declared or recorded,
        source_hashes={"candidate_manifest": f"hash-{run_id}", "config": f"config-{run_id}"},
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
    assert any(finding.kind == "source_inconsistency" for finding in result.findings)
    assert result.evidence_refs[0].level == "recorded"


def test_missing_manifest_lowers_confidence() -> None:
    result = audit_comparability(request(run("a", 0.84, None, 200), run("b", 0.76, 1000)))
    assert result.findings[0].confidence == "medium"
    assert result.evidence_refs[0].level == "declared"


def test_equal_pool_is_not_full_comparability_claim() -> None:
    result = audit_comparability(request(run("a", 0.84, 1000), run("b", 0.76, 1000)))
    assert result.findings[0].kind == "comparable_candidate_pool"
    assert "other evaluation conditions remain unchecked" in result.findings[0].summary


def test_endpoint_requires_bearer() -> None:
    client = TestClient(app)
    response = client.post("/v1/audits/comparability", json=request(run("a", 0.84, 200), run("b", 0.76, 1000)).model_dump())
    assert response.status_code == 401


def test_endpoint_returns_audit() -> None:
    client = TestClient(app)
    response = client.post(
        "/v1/audits/comparability",
        headers={"Authorization": "Bearer local-test-token"},
        json=request(run("a", 0.84, 200), run("b", 0.76, 1000)).model_dump(),
    )
    assert response.status_code == 200
    assert response.json()["findings"][0]["id"] == "candidate-pool-mismatch"

