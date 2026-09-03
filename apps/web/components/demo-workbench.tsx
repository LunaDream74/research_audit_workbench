"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JarvisAdvisor } from "@/components/jarvis-advisor";
import {
  createChallengePreview,
  createResolutionPlan,
  digestPlan,
  type ChallengePreview,
  type ResolutionPlan,
  validatePlan,
} from "@/src/domain/investigation";
import { reviewInvestigation } from "@/src/domain/jarvis-review";
import { demoQuestion, demoRuns, recordedScore, selectedPairLabel } from "@/src/demo/fixture";
import { registerWebMCPTools } from "@/src/webmcp/adapter";
import { buildDemoTools } from "@/src/webmcp/demo-tools";

type AuditState = "idle" | "complete";
type ApprovalRecord = {
  version: number;
  digest: string;
  status: "Approved" | "Approved with limitation";
  rationale: string;
  warning?: string;
};

export function DemoWorkbench() {
  const [selected, setSelected] = useState<string[]>(["run-a", "run-b"]);
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [webMCPStatus, setWebMCPStatus] = useState<"checking" | "native" | "fallback">("checking");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceInspected, setEvidenceInspected] = useState(false);
  const [investigationSaved, setInvestigationSaved] = useState(false);
  const [challengeText, setChallengeText] = useState("The smaller pool was an intentional sanity check.");
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);
  const [challengeConfirmed, setChallengeConfirmed] = useState(false);
  const [plan, setPlan] = useState<ResolutionPlan | null>(null);
  const [planDigest, setPlanDigest] = useState("");
  const [limitationAccepted, setLimitationAccepted] = useState(false);
  const [approvalRationale, setApprovalRationale] = useState("");
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);

  const pairLabel = useMemo(() => selectedPairLabel(selected), [selected]);
  const pairReady = selected.length === 2;
  const selectionDigest = `demo-${selected.join("-")}-v1`;
  const planValidation = useMemo(() => plan ? validatePlan(plan) : null, [plan]);
  const jarvisReview = useMemo(() => reviewInvestigation({
    pairReady,
    auditComplete: auditState === "complete",
    evidenceInspected,
    findingSaved: investigationSaved,
    challengePreviewed: Boolean(challengePreview),
    challengeConfirmed,
    planDrafted: Boolean(plan),
    planValidation,
    digestReady: Boolean(planDigest),
    approved: Boolean(approval),
  }), [approval, auditState, challengeConfirmed, challengePreview, evidenceInspected, investigationSaved, pairReady, plan, planDigest, planValidation]);

  function resetInvestigation() {
    setAuditState("idle");
    setEvidenceOpen(false);
    setEvidenceInspected(false);
    setInvestigationSaved(false);
    setChallengePreview(null);
    setChallengeConfirmed(false);
    setPlan(null);
    setPlanDigest("");
    setApproval(null);
  }

  const revealAudit = useCallback(() => {
    setAuditState("complete");
    return {
      schemaVersion: "1.0",
      selectionDigest,
      findingId: "candidate-pool-mismatch",
      temporary: true,
      conclusion: "Direct model ranking is not established under mismatched candidate pools.",
      evidenceRefIds: ["run-a:manifest:candidate-count", "run-b:manifest:candidate-count"],
    };
  }, [selectionDigest]);

  const openEvidence = useCallback(() => {
    setEvidenceOpen(true);
    setEvidenceInspected(true);
  }, []);

  const stageChallenge = useCallback((context = challengeText) => {
    const preview = createChallengePreview(context);
    setChallengeText(context);
    setChallengePreview(preview);
    setChallengeConfirmed(false);
    return preview;
  }, [challengeText]);

  const stagePlan = useCallback(() => {
    const nextPlan = createResolutionPlan();
    setPlan(nextPlan);
    setApproval(null);
    return nextPlan;
  }, []);

  useEffect(() => {
    let active = true;
    const registration = registerWebMCPTools(
      buildDemoTools({
        getComparison: () => ({
          schemaVersion: "1.0",
          selectionDigest,
          question: demoQuestion,
          runs: demoRuns.filter((run) => selected.includes(run.id)),
          evidenceAvailability: "Recorded manifests, declared configurations, and one retrieval example",
        }),
        runAudit: () => revealAudit(),
        showEvidence: (findingId) => {
          if (findingId !== "candidate-pool-mismatch") return { schemaVersion: "1.0", error: "finding_not_found" };
          openEvidence();
          return {
            schemaVersion: "1.0",
            opened: true,
            findingId,
            sources: [
              { run: "Run A", level: "recorded", candidateCount: 200, path: "run-a/candidate_manifest.json" },
              { run: "Run B", level: "recorded", candidateCount: 1000, path: "run-b/candidate_manifest.json" },
            ],
            limitation: "The example does not quantify how much of the score gap the mismatch caused.",
          };
        },
        stageChallenge: (findingId, context) => {
          if (!investigationSaved) return { error: "human_save_required", message: "The researcher must save the finding before a challenge can be staged." };
          if (findingId !== "candidate-pool-mismatch") return { error: "finding_not_found" };
          return stageChallenge(context);
        },
        stagePlan: (investigationId) => {
          if (!challengeConfirmed) return { error: "human_confirmation_required", message: "The researcher must confirm the challenge revision first." };
          if (investigationId !== "demo-investigation-1") return { error: "investigation_not_found" };
          return stagePlan();
        },
        reviewReadiness: () => jarvisReview,
        getDecisionBrief: () => auditState === "complete" ? {
          brief: {
            schemaVersion: "1.0", status: approval ? "approved" : "draft",
            watermark: approval ? "AUTHORITATIVE" : "DRAFT — NOT APPROVED",
            comparisonDigest: selectionDigest, question: demoQuestion,
            runs: demoRuns.filter((run) => selected.includes(run.id)),
            findings: [{ id: "candidate-pool-mismatch", severity: "critical", evidenceRefIds: ["run-a:manifest:candidate-count", "run-b:manifest:candidate-count"] }],
            humanAuthorityStatement: "A researcher approves the exact plan; no experiment is executed automatically.",
          },
          markdown: `# Research audit decision brief\n\n> ${approval ? "AUTHORITATIVE" : "DRAFT — NOT APPROVED"}\n\n${demoQuestion}`,
        } : { error: "audit_required" },
      }),
    );
    registration.ready.then(
      () => { if (active) setWebMCPStatus(registration.supported ? "native" : "fallback"); },
      () => { if (active) setWebMCPStatus("fallback"); },
    );
    return () => {
      active = false;
      registration.abort();
    };
  }, [approval, auditState, challengeConfirmed, investigationSaved, jarvisReview, openEvidence, revealAudit, selected, selectionDigest, stageChallenge, stagePlan]);

  useEffect(() => {
    let active = true;
    if (!plan) return () => { active = false; };
    digestPlan(plan).then((value) => { if (active) setPlanDigest(value); });
    return () => { active = false; };
  }, [plan]);

  function toggleRun(runId: string) {
    resetInvestigation();
    setSelected((current) =>
      current.includes(runId) ? current.filter((id) => id !== runId) : [...current, runId].slice(-2),
    );
  }

  function updatePlan<K extends keyof ResolutionPlan>(key: K, value: ResolutionPlan[K]) {
    setPlan((current) => current ? { ...current, [key]: value } : current);
    setApproval(null);
    setLimitationAccepted(false);
  }

  function approvePlan() {
    if (!plan || !planDigest || !planValidation || planValidation.blockingErrors.length) return;
    if (planValidation.limitations.length && !limitationAccepted) return;
    setApproval({
      version: plan.version,
      digest: planDigest,
      status: planValidation.limitations.length ? "Approved with limitation" : "Approved",
      rationale: approvalRationale || "Matched reevaluation resolves the current comparison uncertainty.",
      warning: planValidation.limitations[0],
    });
  }

  function focusControl(id: string) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const section = document.getElementById(id);
        section?.scrollIntoView({ behavior: "smooth", block: "center" });
        section?.querySelector<HTMLElement>("button:not(:disabled), textarea:not(:disabled), input:not(:disabled)")?.focus({ preventScroll: true });
      });
    });
  }

  function runJarvisNextAction() {
    switch (jarvisReview.nextAction.id) {
      case "select_runs":
        focusControl("run-selection");
        break;
      case "run_audit":
        revealAudit();
        focusControl("comparability-audit");
        break;
      case "inspect_evidence":
        openEvidence();
        focusControl("finding-evidence");
        break;
      case "save_finding":
        focusControl("comparability-audit");
        break;
      case "stage_challenge":
        stageChallenge();
        focusControl("researcher-challenge");
        break;
      case "confirm_challenge":
        focusControl("researcher-challenge");
        break;
      case "stage_plan":
        stagePlan();
        focusControl("resolution-plan");
        break;
      case "fix_plan":
      case "save_plan":
      case "approve_plan":
        focusControl("resolution-plan");
        break;
      case "complete":
        focusControl("approval-record");
        break;
    }
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
            {webMCPStatus === "native" ? "WebMCP · 7 tools live" : "WebMCP · manual fallback"}
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
          <div><strong>{pairLabel}</strong><small>Live page scope exposed to the browser agent</small></div>
        </div>
      </section>

      <div className="investigation-layout">
      <div className="investigation-main">
      <section className="question-strip"><span>Decision question</span><strong>{demoQuestion}</strong></section>

      <section className="run-grid" id="run-selection" aria-label="Experiment runs">
        {demoRuns.map((run) => {
          const isSelected = selected.includes(run.id);
          return (
            <article className={`run-card ${isSelected ? "selected" : ""}`} key={run.id}>
              <div className="run-heading">
                <div><p className="run-name">{run.name}</p><p className="run-role">{run.role}</p></div>
                <label className="select-control"><input aria-label={`Select ${run.name}`} checked={isSelected} onChange={() => toggleRun(run.id)} type="checkbox" /><span>{isSelected ? "Selected" : "Select"}</span></label>
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

      <section className="audit-panel" id="comparability-audit">
        <div className="audit-header">
          <div><p className="eyebrow">Neutral audit</p><h2>Comparability, before ranking</h2></div>
          <button disabled={!pairReady || webMCPStatus === "checking"} onClick={() => revealAudit()} type="button">Run prepared audit</button>
        </div>

        {auditState === "idle" ? (
          <div className="audit-empty"><div className="scan-lines" aria-hidden="true" /><p>The higher recorded score is visible. Whether it establishes a better model is still unchecked.</p></div>
        ) : (<>
          <div className="finding" role="status">
            <div className="finding-icon" aria-hidden="true">!</div>
            <div className="finding-body">
              <div className="finding-title-row"><h3>Different evaluation conditions</h3><span>Critical · manifest verified</span></div>
              <p><strong>Model improvement not established.</strong> Run A used 200 candidate images per query; Run B used 1,000. Both scores remain valid individually, but they do not support direct model ranking under matched conditions.</p>
              <div className="finding-actions">
                <button className="secondary-button" onClick={openEvidence} type="button">Inspect cited evidence</button>
                {!investigationSaved ? <button onClick={() => setInvestigationSaved(true)} type="button">Save finding and create investigation</button> : <span className="saved-label">✓ Finding saved by researcher</span>}
              </div>
              <p className="limitation">This evidence illustrates why the evaluations differ. It does not quantify how much of the eight-point gap the mismatch caused.</p>
            </div>
          </div>
          <div className="evidence-grid" aria-label="Four-condition audit matrix">
            <div><span>Candidate pool</span><strong>Mismatch · blocker</strong><small>200 vs 1,000</small></div>
            <div><span>Evaluation split</span><strong>Matched</strong><small>test-v1</small></div>
            <div><span>Preprocessing</span><strong>Matched</strong><small>clip-standard-v1</small></div>
            <div><span>Metric definition</span><strong>Matched</strong><small>correct target in top 5</small></div>
          </div>
        </>)}
      </section>

      {evidenceOpen && (
        <section className="workflow-panel evidence-panel" id="finding-evidence" aria-label="Finding evidence">
          <div className="panel-heading"><div><p className="eyebrow">Inspectable trust</p><h2>Candidate-pool evidence</h2></div><button className="text-button" onClick={() => setEvidenceOpen(false)} type="button">Close</button></div>
          <div className="evidence-grid">
            <div><span>Run A · recorded input</span><strong>200 candidates</strong><code>run-a/candidate_manifest.json → /candidate_count</code><small>sha256:run-a-manifest</small></div>
            <div><span>Run B · recorded input</span><strong>1,000 candidates</strong><code>run-b/candidate_manifest.json → /candidate_count</code><small>sha256:run-b-manifest</small></div>
          </div>
          <div className="distractor-card"><span>Retrieval example</span><strong>“A pedestrian crossing a road in the rain”</strong><p>Run B included plausible distractors such as a rainy intersection at dusk and a pedestrian under an umbrella; those candidates were absent from Run A.</p><small>Illustrative only · does not quantify causality</small></div>
        </section>
      )}

      {investigationSaved && (
        <section className="workflow-panel" id="researcher-challenge">
          <div className="panel-heading"><div><p className="eyebrow">Human challenge</p><h2>Add research context without erasing evidence</h2></div><span className="step-chip">Investigation demo-investigation-1</span></div>
          <label className="field-label" htmlFor="challenge">Researcher context</label>
          <textarea id="challenge" onChange={(event) => setChallengeText(event.target.value)} value={challengeText} />
          <button className="secondary-button" onClick={() => stageChallenge()} type="button">Preview revised interpretation</button>
          {challengePreview && (
            <div className="revision-preview">
              <div><span>Before</span><p>{challengePreview.previousInterpretation}</p></div>
              <div><span>Proposed</span><p>{challengePreview.proposedInterpretation}</p></div>
              <div className="retained"><span>Retained factual limitation</span><p>{challengePreview.retainedLimitation}</p></div>
              {!challengeConfirmed ? <button onClick={() => setChallengeConfirmed(true)} type="button">Confirm challenge and revision</button> : <span className="saved-label">✓ Confirmed by researcher · prior revision preserved</span>}
            </div>
          )}
        </section>
      )}

      {challengeConfirmed && (
        <section className="workflow-panel" id="resolution-plan">
          <div className="panel-heading"><div><p className="eyebrow">Controlled resolution</p><h2>Approve an exact reevaluation plan</h2></div>{plan && <span className="step-chip">Draft v{plan.version}</span>}</div>
          {!plan ? <button onClick={() => stagePlan()} type="button">Draft matched reevaluation plan</button> : (
            <div className="plan-editor">
              <p className="plan-question">{plan.researchQuestion}</p>
              <div className="plan-grid">
                <label>Run A candidate pool<input aria-label="Run A candidate pool" disabled={!!approval} min="1" onChange={(event) => updatePlan("candidatePoolA", Number(event.target.value))} type="number" value={plan.candidatePoolA} /></label>
                <label>Run B candidate pool<input aria-label="Run B candidate pool" disabled={!!approval} min="1" onChange={(event) => updatePlan("candidatePoolB", Number(event.target.value))} type="number" value={plan.candidatePoolB} /></label>
                <label>Batch size<input aria-label="Batch size" disabled={!!approval} min="1" onChange={(event) => updatePlan("batchSize", Number(event.target.value))} type="number" value={plan.batchSize} /></label>
                <label>Evaluation split<input aria-label="Evaluation split" readOnly value={plan.evaluationSplitA} /></label>
              </div>
              {planValidation?.informationalWarnings.map((warning) => <p className="info-note" key={warning}>{warning}</p>)}
              {planValidation?.limitations.map((warning) => <div className="warning-note" key={warning}><strong>Decision-relevant limitation</strong><p>{warning}</p><label><input checked={limitationAccepted} onChange={(event) => setLimitationAccepted(event.target.checked)} type="checkbox" /> I acknowledge this exact consequence.</label></div>)}
              <label className="field-label" htmlFor="rationale">Approval rationale (optional)</label>
              <input disabled={!!approval} id="rationale" onChange={(event) => setApprovalRationale(event.target.value)} placeholder="Why this exact plan is the right next action" value={approvalRationale} />
              <div className="digest-line"><span>Exact plan digest</span><code>{planDigest || "Calculating…"}</code></div>
              <button disabled={!!approval || !planDigest || !!planValidation?.blockingErrors.length || (!!planValidation?.limitations.length && !limitationAccepted)} onClick={approvePlan} type="button">{approval ? "Exact version approved" : planValidation?.limitations.length ? "Approve with limitation" : "Approve exact plan"}</button>
            </div>
          )}
        </section>
      )}

      {approval && (
        <section className="approval-record" id="approval-record" role="status">
          <div className="approval-mark">✓</div>
          <div><p className="eyebrow">Immutable demo history</p><h2>{approval.status} · plan v{approval.version}</h2><p>{approval.rationale}</p>{approval.warning && <p className="approval-warning">Accepted: {approval.warning}</p>}<code>{approval.digest}</code><small>Approved by researcher · no execution permission granted</small></div>
        </section>
      )}

      <footer className="demo-footer"><span>Disposable walkthrough</span><span>No account · no persistence · no autonomous execution</span></footer>
      </div>
      <aside className="jarvis-rail" aria-label="Persistent investigation assistant">
        <JarvisAdvisor review={jarvisReview} onNextAction={runJarvisNextAction} />
      </aside>
      </div>
    </main>
  );
}
