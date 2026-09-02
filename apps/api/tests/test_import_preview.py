import io
import json
import stat
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import app
from src.auth.bearer import require_bearer
from src.importers import ImportPackageError, preview_prepared_package

FIXTURE_ROOT = Path(__file__).parents[3] / "demo" / "retrieval-package"


def make_archive(files: dict[str, bytes] | None = None) -> bytes:
    contents = files or {
        path.relative_to(FIXTURE_ROOT).as_posix(): path.read_bytes()
        for path in FIXTURE_ROOT.rglob("*")
        if path.is_file()
    }
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path, data in contents.items():
            archive.writestr(path, data)
    return output.getvalue()


def test_prepared_package_produces_a_deterministic_review() -> None:
    package = make_archive()
    first = preview_prepared_package(package)
    second = preview_prepared_package(package)

    assert first.digest == second.digest
    assert first.preview_id.startswith("preview-")
    assert len(first.files) == 10
    assert [run.recorded_candidate_count for run in first.proposed_runs] == [200, 1000]
    assert first.audit_readiness["status"] == "ready"
    assert any("candidate pools differ" in warning for warning in first.warnings)


def test_preview_endpoint_requires_a_bearer_and_returns_the_graph() -> None:
    client = TestClient(app)
    package = make_archive()
    denied = client.post(
        "/v1/imports/preview",
        files={"package": ("prepared.zip", package, "application/zip")},
        data={"schema_version": "1.0"},
    )
    app.dependency_overrides[require_bearer] = lambda: "test-token"
    try:
        response = client.post(
            "/v1/imports/preview",
            headers={"Authorization": "Bearer test-token"},
            files={"package": ("prepared.zip", package, "application/zip")},
            data={"schema_version": "1.0"},
        )
    finally:
        app.dependency_overrides.pop(require_bearer, None)

    assert denied.status_code == 401
    assert response.status_code == 200
    assert response.json()["proposed_experiment"]["name"] == "Rain retrieval comparison"


@pytest.mark.parametrize(
    ("path", "message"),
    [
        ("../experiment.json", "Unsafe archive path"),
        ("nested/package.zip", "Nested archives"),
        ("run-a/checkpoint.safetensors", "Checkpoint or binary"),
        ("run-a/image.png", "Unsupported file type"),
    ],
)
def test_unsafe_archive_members_are_rejected(path: str, message: str) -> None:
    with pytest.raises(ImportPackageError, match=message):
        preview_prepared_package(make_archive({path: b"content"}))


def test_symlink_is_rejected() -> None:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as archive:
        link = zipfile.ZipInfo("experiment.json")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        archive.writestr(link, "target.json")
    with pytest.raises(ImportPackageError, match="Symbolic links"):
        preview_prepared_package(output.getvalue())


def test_suspicious_expansion_ratio_is_rejected() -> None:
    huge_json = json.dumps({"padding": "0" * 200_000}).encode()
    with pytest.raises(ImportPackageError, match="Suspicious compression ratio"):
        preview_prepared_package(make_archive({"experiment.json": huge_json}))


def test_invalid_or_incomplete_prepared_schema_is_rejected() -> None:
    experiment = json.dumps({"schema_version": "1.0", "experiment": "Only one", "runs": ["run-a"]}).encode()
    with pytest.raises(ImportPackageError, match="exactly two runs"):
        preview_prepared_package(make_archive({"experiment.json": experiment}))
