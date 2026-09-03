"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Preview = {
  preview_id: string;
  digest: string;
  files: Array<{ path: string; sha256: string; kind: string; proposed_run_id: string | null }>;
  proposed_experiment: { name: string; description: string };
  proposed_runs: Array<{ id: string; name: string; metric_name: string; metric_value: number; recorded_candidate_count: number | null }>;
  warnings: string[];
  audit_readiness: { status: string; detail: string };
};

export function ImportReview() {
  const [hydrated, setHydrated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmedExperimentId, setConfirmedExperimentId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function requestPreview() {
    if (!file) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const body = new FormData();
      body.set("package", file);
      body.set("schema_version", "1.0");
      const response = await fetch("/api/imports/preview", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) setError(result.detail ?? result.error ?? "Preview failed");
      else setPreview(result);
    } catch {
      setError("The package could not be checked. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!file || !preview) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("package", file);
      body.set("digest", preview.digest);
      const response = await fetch("/api/imports/confirm", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) setError(result.detail ?? result.error ?? "Confirmation failed");
      else if (typeof result.experiment_id === "string") setConfirmedExperimentId(result.experiment_id);
      else setError("The import was confirmed but its experiment identifier was not returned.");
    } catch {
      setError("The import could not be confirmed. No records were saved.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmedExperimentId) {
    return (
      <section className="import-success" aria-live="polite">
        <p className="eyebrow">Import confirmed</p>
        <h2>Two runs are now durable</h2>
        <p>The reviewed snapshot, file hashes, and provenance survived as your private records.</p>
        <Link className="primary-link" href={`/workspace/investigations/new?experiment=${encodeURIComponent(confirmedExperimentId)}`}>Audit these runs</Link>
        <Link className="secondary-link" href="/workspace">Return to workspace</Link>
      </section>
    );
  }

  return (
    <div className="import-layout">
      <section className="import-upload" aria-busy={busy}>
        <p className="eyebrow">Prepared package</p>
        <h1>Review before anything is saved</h1>
        <p>ZIP only, 10 MB maximum. Checkpoints, nested archives, links, and unsafe paths are rejected.</p>
        <div className="sample-options compact">
          <p>Trying the product? Download a sample, then select it below:</p>
          <a download href="/research-audit-metric-definition-sample.zip"><strong>Metric-definition mismatch</strong><span>Recommended · same benchmark, deceptively similar scores</span></a>
          <a download href="/research-audit-sample.zip"><strong>Candidate-pool mismatch</strong><span>Introductory safety-boundary example</span></a>
        </div>
        <label className="file-picker">
          Select prepared ZIP
          <input accept=".zip,application/zip" disabled={!hydrated} onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setConfirmedExperimentId("");
          }} type="file" />
        </label>
        <button disabled={!file || busy} onClick={requestPreview} type="button">
          {busy ? "Checking package…" : "Create review"}
        </button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p className="boundary-note">Preview is stateless. Only the confirmation control below can write records.</p>
      </section>

      {preview && (
        <section className="import-review" aria-busy={busy} aria-label="Import review">
          <div className="review-heading">
            <div><p className="eyebrow">Ready for human confirmation</p><h2>{preview.proposed_experiment.name}</h2></div>
            <span>{preview.audit_readiness.status}</span>
          </div>
          <p>{preview.audit_readiness.detail}</p>
          <div className="run-preview-grid">
            {preview.proposed_runs.map((run) => (
              <article key={run.id}>
                <strong>{run.name}</strong>
                <span>{run.metric_name}: {(run.metric_value * 100).toFixed(0)}%</span>
                <span>{run.recorded_candidate_count?.toLocaleString()} recorded candidates</span>
              </article>
            ))}
          </div>
          <h3>Warnings</h3>
          <ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          <h3>File inventory · {preview.files.length}</h3>
          <div className="file-inventory">
            {preview.files.map((item) => (
              <div key={item.path}><code>{item.path}</code><span>{item.kind} · {item.sha256.slice(0, 22)}…</span></div>
            ))}
          </div>
          <div className="digest-line"><span>Canonical preview digest</span><code>{preview.digest}</code></div>
          <button disabled={busy} onClick={confirmImport} type="button">
            {busy ? "Revalidating…" : "Confirm reviewed import"}
          </button>
        </section>
      )}
    </div>
  );
}
