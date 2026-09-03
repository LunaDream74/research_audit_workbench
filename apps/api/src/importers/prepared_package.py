import hashlib
import io
import json
import stat
import zipfile
from pathlib import PurePosixPath
from typing import Any

from pydantic import ValidationError

from src.schemas import ImportPreview, PreviewFile, RunSnapshot

MAX_COMPRESSED_BYTES = 10 * 1024 * 1024
MAX_EXPANDED_BYTES = 25 * 1024 * 1024
MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_FILES = 64
MAX_DEPTH = 4
MAX_COMPRESSION_RATIO = 100
ARCHIVE_SUFFIXES = {".zip", ".tar", ".tgz", ".gz", ".bz2", ".7z", ".rar"}
BLOCKED_SUFFIXES = {".bin", ".ckpt", ".onnx", ".pkl", ".pt", ".pth", ".safetensors"}
ALLOWED_SUFFIXES = {".json", ".md", ".txt", ".csv"}


class ImportPackageError(ValueError):
    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _safe_path(info: zipfile.ZipInfo) -> PurePosixPath:
    raw = info.filename
    if not raw or "\\" in raw or "\x00" in raw:
        raise ImportPackageError("Archive contains an invalid path")
    path = PurePosixPath(raw)
    if path.is_absolute() or ".." in path.parts or ":" in path.parts[0]:
        raise ImportPackageError(f"Unsafe archive path: {raw}")
    if len(path.parts) > MAX_DEPTH:
        raise ImportPackageError(f"Archive path exceeds the depth limit: {raw}", 413)
    if stat.S_ISLNK(info.external_attr >> 16):
        raise ImportPackageError(f"Symbolic links are not allowed: {raw}")
    return path


def _read_json(files: dict[str, bytes], path: str) -> dict[str, Any]:
    try:
        value = json.loads(files[path])
    except KeyError as error:
        raise ImportPackageError(f"Required file is missing: {path}", 422) from error
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ImportPackageError(f"Invalid JSON file: {path}", 422) from error
    if not isinstance(value, dict):
        raise ImportPackageError(f"Expected a JSON object: {path}", 422)
    return value


def _extract_archive(package_bytes: bytes) -> tuple[dict[str, bytes], list[PreviewFile]]:
    if len(package_bytes) > MAX_COMPRESSED_BYTES:
        raise ImportPackageError("Package exceeds the 10 MB compressed limit", 413)
    try:
        archive = zipfile.ZipFile(io.BytesIO(package_bytes))
    except zipfile.BadZipFile as error:
        raise ImportPackageError("Package is not a valid ZIP archive", 415) from error

    members = [member for member in archive.infolist() if not member.is_dir()]
    if not members:
        raise ImportPackageError("Package contains no files", 422)
    if len(members) > MAX_FILES:
        raise ImportPackageError(f"Package exceeds the {MAX_FILES}-file limit", 413)

    expanded_total = 0
    files: dict[str, bytes] = {}
    inventory: list[PreviewFile] = []
    for member in members:
        path = _safe_path(member)
        suffix = path.suffix.lower()
        if suffix in ARCHIVE_SUFFIXES:
            raise ImportPackageError(f"Nested archives are not allowed: {path}", 415)
        if suffix in BLOCKED_SUFFIXES:
            raise ImportPackageError(f"Checkpoint or binary artifact is not allowed: {path}", 415)
        if suffix not in ALLOWED_SUFFIXES:
            raise ImportPackageError(f"Unsupported file type: {path}", 415)
        if member.file_size > MAX_FILE_BYTES:
            raise ImportPackageError(f"File exceeds the 2 MB limit: {path}", 413)
        expanded_total += member.file_size
        if expanded_total > MAX_EXPANDED_BYTES:
            raise ImportPackageError("Package exceeds the 25 MB expansion limit", 413)
        if member.file_size and member.compress_size == 0:
            raise ImportPackageError(f"Invalid compression metadata: {path}", 400)
        if member.compress_size and member.file_size / member.compress_size > MAX_COMPRESSION_RATIO:
            raise ImportPackageError(f"Suspicious compression ratio: {path}", 413)
        data = archive.read(member)
        normalized = path.as_posix()
        if normalized in files:
            raise ImportPackageError(f"Duplicate archive path: {normalized}")
        files[normalized] = data
        proposed_run_id = path.parts[0] if len(path.parts) > 1 and path.parts[0].startswith("run-") else None
        inventory.append(
            PreviewFile(
                path=normalized,
                sha256=f"sha256:{hashlib.sha256(data).hexdigest()}",
                kind=suffix.removeprefix(".") or "unknown",
                proposed_run_id=proposed_run_id,
            )
        )
    return files, sorted(inventory, key=lambda item: item.path)


def _run_snapshot(run_id: str, files: dict[str, bytes], hashes: dict[str, str]) -> RunSnapshot:
    config = _read_json(files, f"{run_id}/config.json")
    metrics = _read_json(files, f"{run_id}/metrics.json")
    manifest = _read_json(files, f"{run_id}/candidate_manifest.json")
    evaluation = config.get("evaluation")
    if not isinstance(evaluation, dict) or len(metrics) != 1:
        raise ImportPackageError(f"Run {run_id} has an unsupported config or metrics shape", 422)
    metric_name, metric_value = next(iter(metrics.items()))
    try:
        return RunSnapshot(
            id=run_id,
            name=run_id.replace("-", " ").title(),
            metric_name=str(metric_name),
            metric_value=metric_value,
            declared_candidate_count=evaluation.get("candidate_count"),
            recorded_candidate_count=manifest.get("candidate_count"),
            evaluation_split=evaluation.get("split"),
            preprocessing=evaluation.get("preprocessing"),
            metric_definition=evaluation.get("metric_definition") or evaluation.get("metric"),
            source_hashes={
                "config": hashes[f"{run_id}/config.json"],
                "metrics": hashes[f"{run_id}/metrics.json"],
                "candidate_manifest": hashes[f"{run_id}/candidate_manifest.json"],
            },
        )
    except (KeyError, ValidationError, TypeError) as error:
        raise ImportPackageError(f"Run {run_id} contains invalid values", 422) from error


def preview_prepared_package(package_bytes: bytes, schema_version: str = "1.0") -> ImportPreview:
    if schema_version != "1.0":
        raise ImportPackageError("Unsupported package schema version", 415)
    files, inventory = _extract_archive(package_bytes)
    experiment = _read_json(files, "experiment.json")
    if experiment.get("schema_version") != schema_version:
        raise ImportPackageError("Package schema version does not match the request", 422)
    run_ids = experiment.get("runs")
    if not isinstance(run_ids, list) or len(run_ids) != 2 or any(not isinstance(item, str) for item in run_ids):
        raise ImportPackageError("Prepared packages must define exactly two runs", 422)
    hashes = {item.path: item.sha256 for item in inventory}
    runs = [_run_snapshot(run_id, files, hashes) for run_id in run_ids]
    warnings = [
        "Checkpoint binaries are intentionally excluded; imported paths and hashes remain evidence references."
    ]
    if runs[0].recorded_candidate_count != runs[1].recorded_candidate_count:
        warnings.append("The recorded candidate pools differ; direct ranking requires a comparability audit.")
    artifacts = [
        {
            "path": item.path,
            "sha256": item.sha256,
            "kind": item.kind,
            "run_id": item.proposed_run_id,
        }
        for item in inventory
    ]
    canonical = {
        "schema_version": schema_version,
        "files": [item.model_dump(mode="json") for item in inventory],
        "proposed_experiment": {
            "name": str(experiment.get("experiment") or "Imported experiment"),
            "description": "Prepared retrieval comparison",
        },
        "proposed_runs": [run.model_dump(mode="json") for run in runs],
        "proposed_artifacts": artifacts,
        "warnings": warnings,
        "audit_readiness": {
            "status": "ready",
            "detail": "Exactly two runs include metrics, configs, and recorded candidate manifests.",
        },
    }
    digest = hashlib.sha256(
        json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    return ImportPreview(preview_id=f"preview-{digest[:16]}", digest=digest, **canonical)
