"use client";

import { useEffect, useMemo, useState } from "react";
import { demoQuestion, demoRuns, recordedScore, selectedPairLabel } from "@/src/demo/fixture";
import { registerWebMCPTools } from "@/src/webmcp/adapter";
import { buildCoreDemoTools } from "@/src/webmcp/demo-tools";

type AuditState = "idle" | "complete";

export function DemoWorkbench() {
  const [selected, setSelected] = useState<string[]>(["run-a", "run-b"]);
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [webMCPStatus, setWebMCPStatus] = useState<"checking" | "native" | "fallback">("checking");
  const pairLabel = useMemo(() => selectedPairLabel(selected), [selected]);
  const pairReady = selected.length === 2;
  const selectionDigest = `demo-${selected.join("-")}-v1`;

  useEffect(() => {
    let active = true;
    const registration = registerWebMCPTools(
      buildCoreDemoTools({
        getComparison: () => ({
          schemaVersion: "1.0",
          selectionDigest,
          question: demoQuestion,
          runs: demoRuns.filter((run) => selected.includes(run.id)),
          evidenceAvailability: "Recorded candidate manifests and declared evaluation configurations",
        }),
        runAudit: (requestedDigest) => {
          setAuditState("complete");
          return {
            schemaVersion: "1.0",
            selectionDigest: requestedDigest,
            findingId: "candidate-pool-mismatch",
            temporary: true,
            conclusion: "Direct model ranking is not established under mismatched candidate pools.",
            evidenceRefIds: ["run-a:manifest:candidate-count", "run-b:manifest:candidate-count"],
          };
        },
      }),
    );
    registration.ready.then(
      () => {
        if (active) setWebMCPStatus(registration.supported ? "native" : "fallback");
      },
      () => {
        if (active) setWebMCPStatus("fallback");
      },
    );
    return () => {
      active = false;
      registration.abort();
    };
  }, [selected, selectionDigest]);

  function toggleRun(runId: string) {
    setAuditState("idle");
    setSelected((current) =>
      current.includes(runId) ? current.filter((id) => id !== runId) : [...current, runId].slice(-2),
    );
  }

  return (
    <main className="workbench">
      <header className="topbar">
        <div>
          <p className="product-mark"><span aria-hidden="true">◇</span> Research Audit Workbench</p>
          <p className="workspace-label">Rain retrieval / decision workspace</p>
        </div>
        <div className="header-badges">
          <div className={`mcp-badge ${webMCPStatus}`}>
            {webMCPStatus === "native" ? "WebMCP · 2 tools live" : "WebMCP · manual fallback"}
          </div>
          <div className="demo-badge"><span /> Demo data · nothing is saved</div>
        </div>
      </header>

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Investigation setup</p>
          <h1>Do these results support the next use of compute?</h1>
          <p className="hero-copy">Recorded scores are evidence, not a verdict. Select the runs, then audit whether their evaluation conditions support a direct comparison.</p>
        </div>
        <div className="scope-card" aria-live="polite">
          <span className={pairReady ? "scope-dot ready" : "scope-dot"} />
          <div>
            <strong>{pairLabel}</strong>
            <small>Live page scope exposed to the browser agent</small>
          </div>
        </div>
      </section>

      <section className="question-strip">
        <span>Decision question</span>
        <strong>{demoQuestion}</strong>
      </section>

      <section className="run-grid" aria-label="Experiment runs">
        {demoRuns.map((run) => {
          const isSelected = selected.includes(run.id);
          return (
            <article className={`run-card ${isSelected ? "selected" : ""}`} key={run.id}>
              <div className="run-heading">
                <div>
                  <p className="run-name">{run.name}</p>
                  <p className="run-role">{run.role}</p>
                </div>
                <label className="select-control">
                  <input
                    aria-label={`Select ${run.name}`}
                    checked={isSelected}
                    onChange={() => toggleRun(run.id)}
                    type="checkbox"
                  />
                  <span>{isSelected ? "Selected" : "Select"}</span>
                </label>
              </div>
              <div className="metric-row">
                <div><span>Recorded {run.metricName}</span><strong>{recordedScore(run)}</strong></div>
                <div><span>Candidate manifest</span><strong>{run.candidateCount.toLocaleString()}</strong></div>
              </div>
              <div className="source-line"><span>Manifest</span><code>{run.manifestId}</code></div>
            </article>
          );
        })}
      </section>

      <section className="audit-panel">
        <div className="audit-header">
          <div>
            <p className="eyebrow">Neutral audit</p>
            <h2>Comparability, before ranking</h2>
          </div>
          <button disabled={!pairReady} onClick={() => setAuditState("complete")} type="button">
            Run prepared audit
          </button>
        </div>

        {auditState === "idle" ? (
          <div className="audit-empty">
            <div className="scan-lines" aria-hidden="true" />
            <p>The higher recorded score is visible. Whether it establishes a better model is still unchecked.</p>
          </div>
        ) : (
          <div className="finding" role="status">
            <div className="finding-icon" aria-hidden="true">!</div>
            <div className="finding-body">
              <div className="finding-title-row">
                <h3>Different evaluation conditions</h3>
                <span>Critical · manifest verified</span>
              </div>
              <p><strong>Model improvement not established.</strong> Run A used 200 candidate images per query; Run B used 1,000. Both scores remain valid individually, but they do not support direct model ranking under matched conditions.</p>
              <div className="evidence-grid">
                <div><span>Run A recorded input</span><strong>200 candidates</strong><code>run-a/candidate_manifest.json → /candidate_count</code></div>
                <div><span>Run B recorded input</span><strong>1,000 candidates</strong><code>run-b/candidate_manifest.json → /candidate_count</code></div>
              </div>
              <p className="limitation">This evidence illustrates why the evaluations differ. It does not quantify how much of the eight-point gap the mismatch caused.</p>
            </div>
          </div>
        )}
      </section>

      <footer className="demo-footer">
        <span>Disposable walkthrough</span>
        <span>No account · no persistence · no autonomous execution</span>
      </footer>
    </main>
  );
}
