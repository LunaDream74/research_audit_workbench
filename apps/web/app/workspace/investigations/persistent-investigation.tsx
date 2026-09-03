"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JarvisAdvisor } from "@/components/jarvis-advisor";
import { comparisonDigest, primaryFinding, trustedRunSnapshot, type AuditResult } from "@/src/domain/audit";
import { createDecisionBrief, renderDecisionBriefJson, renderDecisionBriefMarkdown } from "@/src/domain/decision-brief";
import { createChallengePreview, createResolutionPlan, preparedSampleChallengeSuggestion, type ChallengePreview, type ResolutionPlan, validatePlan } from "@/src/domain/investigation";
import { reviewInvestigation } from "@/src/domain/jarvis-review";
import { registerWebMCPTools } from "@/src/webmcp/adapter";
import { buildInvestigationTools } from "@/src/webmcp/investigation-tools";

type RunRecord = { id: string; name: string; metrics: unknown; config: unknown; source_snapshot: unknown };
type SavedPlan = { plan_version: number; digest: string; plan: ResolutionPlan; validation: ReturnType<typeof validatePlan> };
const question = "Does this apparent improvement justify another training run?";

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
}

export function PersistentInvestigation({ runs }: { runs: RunRecord[] }) {
  const router = useRouter();
  const snapshots = useMemo(() => runs.map(trustedRunSnapshot), [runs]);
  const baseline = snapshots[1];
  const [selectionDigest, setSelectionDigest] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [evidenceInspected, setEvidenceInspected] = useState(false);
  const [investigationId, setInvestigationId] = useState("");
  const [revision, setRevision] = useState(0);
  const [challengeText, setChallengeText] = useState("");
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);
  const [plan, setPlan] = useState<ResolutionPlan>(() => createResolutionPlan({ candidatePool: baseline.recorded_candidate_count ?? baseline.declared_candidate_count, evaluationSplit: baseline.recorded_evaluation_split ?? baseline.evaluation_split, preprocessing: baseline.recorded_preprocessing ?? baseline.preprocessing, metricDefinition: baseline.recorded_metric_definition ?? baseline.metric_definition }));
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [rationale, setRationale] = useState("This matched reevaluation resolves the decision-relevant mismatches without additional training.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const planValidation = useMemo(() => validatePlan(plan), [plan]);
  const primary = audit ? primaryFinding(audit.findings) : undefined;
  const sampleChallengeSuggestion = useMemo(() => preparedSampleChallengeSuggestion(snapshots), [snapshots]);
  const challengeExample = primary?.kind === "metric_definition_mismatch"
    ? "Example: The two scores were reported under different aggregation definitions."
    : "Example: The smaller pool was an intentional sanity check.";
  const brief = useMemo(() => audit ? createDecisionBrief({ question, comparisonDigest: selectionDigest, runs: snapshots, audit, challenge: challengePreview, plan: revision >= 2 ? plan : null, validation: revision >= 2 ? planValidation : null, binding: savedPlan ? { version: savedPlan.plan_version, digest: savedPlan.digest } : null }) : null, [audit, challengePreview, plan, planValidation, revision, savedPlan, selectionDigest, snapshots]);
  const jarvisReview = useMemo(() => reviewInvestigation({ pairReady: true, auditComplete: Boolean(audit), evidenceInspected, findingSaved: Boolean(investigationId), challengePreviewed: Boolean(challengePreview), challengeConfirmed: revision >= 2, planDrafted: revision >= 2, planValidation: revision >= 2 ? planValidation : null, digestReady: Boolean(savedPlan), approved: false }), [audit, challengePreview, evidenceInspected, investigationId, planValidation, revision, savedPlan]);

  useEffect(() => { let live = true; comparisonDigest(question, snapshots).then((value) => { if (live) setSelectionDigest(value); }); return () => { live = false; }; }, [snapshots]);

  useEffect(() => {
    if (!investigationId || revision !== 1) return;
    const section = document.getElementById("persistent-challenge");
    const input = document.getElementById("researcher-context");
    section?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus({ preventScroll: true });
  }, [investigationId, revision]);

  const call = useCallback(async (path: string, body: unknown) => {
    setBusy(true); setError("");
    try { const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) { setError(result.detail ?? result.error ?? "Request failed"); return null; } return result; }
    catch { setError("The request could not be completed. Your current record is unchanged."); return null; }
    finally { setBusy(false); }
  }, []);

  const runAudit = useCallback(async () => {
    if (!selectionDigest) return { schemaVersion: "1.0", error: "digest_pending" };
    const result = await call("/api/audits/comparability", { runAId: runs[0].id, runBId: runs[1].id, question, selectionDigest });
    if (result) {
      const nextAudit = result as AuditResult;
      setAudit(nextAudit);
      setChallengePreview(null);
      setChallengeText("");
    }
    return result ?? { schemaVersion: "1.0", error: "audit_failed" };
  }, [call, runs, selectionDigest]);

  useEffect(() => {
    if (!selectionDigest) return;
    const registration = registerWebMCPTools(buildInvestigationTools({
      getComparison: () => ({ schemaVersion: "1.0", selectionDigest, question, runs: snapshots as never, evidenceAvailability: "Imported owner-scoped snapshots" }),
      runAudit: () => runAudit(),
      showEvidence: (findingId, ids) => { const finding = audit?.findings.find((item) => item.id === findingId); if (!finding) return { error: "finding_not_found" }; setEvidenceInspected(true); const wanted = new Set(ids?.length ? ids : finding.evidence_ref_ids); return { finding, sources: audit!.evidence_refs.filter((item) => wanted.has(item.id)) }; },
      stageChallenge: (findingId, context) => { if (!investigationId) return { error: "human_save_required" }; if (findingId !== primary?.id) return { error: "finding_not_primary_challenge_target" }; if (!context.trim()) return { error: "researcher_context_required" }; const preview = createChallengePreview(context, findingId, primary); setChallengeText(context); setChallengePreview(preview); return preview; },
      stagePlan: () => revision >= 2 ? plan : { error: "human_confirmation_required" },
      reviewReadiness: () => jarvisReview,
      getDecisionBrief: () => brief ? { brief, markdown: renderDecisionBriefMarkdown(brief) } as unknown as Record<string, unknown> : { error: "audit_required" },
    }));
    return () => registration.abort();
  }, [audit, brief, investigationId, jarvisReview, plan, primary, revision, runAudit, selectionDigest, snapshots]);

  async function saveAudit() {
    if (!audit || !primary) return;
    const result = await call("/api/investigations", { runAId: runs[0].id, runBId: runs[1].id, question, selectionDigest, auditResult: audit, findingSnapshot: { ...primary, retainedLimitation: primary.summary } });
    if (result) { setInvestigationId(result.investigation_id); setRevision(result.analysis_revision); }
  }
  async function confirmChallenge() { if (!challengePreview) return; const result = await call(`/api/investigations/${investigationId}/challenges`, { expectedRevision: revision, challengePreview }); if (result) setRevision(result.analysis_revision); }
  async function savePlan() { const result = await call(`/api/investigations/${investigationId}/plans`, { expectedRevision: revision, plan }); if (result) { setSavedPlan(result); setPlan(result.plan); } }
  async function approvePlan() { if (!savedPlan) return; const result = await call(`/api/investigations/${investigationId}/plans/${savedPlan.plan_version}/approve`, { digest: savedPlan.digest, rationale, acknowledgedLimitations: savedPlan.validation.limitations }); if (result) router.push(`/workspace/investigations/${investigationId}`); }
  function exportBrief(format: "md" | "json") { if (!brief) return; download(`research-audit-draft.${format}`, format === "md" ? renderDecisionBriefMarkdown(brief) : renderDecisionBriefJson(brief), format === "md" ? "text/markdown" : "application/json"); }
  function focusControl(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function runJarvisNextAction() { if (!audit) void runAudit(); else if (!investigationId) focusControl("persistent-finding"); else if (revision < 2) { if (challengeText.trim()) setChallengePreview(createChallengePreview(challengeText, primary?.id, primary)); focusControl("persistent-challenge"); } else focusControl("persistent-plan"); }

  return <div className="persistent-flow" aria-busy={busy}>
    <div className="workspace-heading"><div><p className="eyebrow">Persistent control room</p><h1>Turn evidence into a durable decision</h1></div><span className="step-chip">Human confirmation only</span></div>
    <div className="investigation-layout"><div className="investigation-main">
      <section className="comparison-panel" id="persistent-finding"><h2>{question}</h2>
        <div className="run-preview-grid">{snapshots.map((run) => <article key={run.id}><strong>{run.name}</strong><span>{run.metric_name}: {run.metric_value}</span></article>)}</div>
        {!audit ? <button disabled={busy || !selectionDigest} onClick={() => void runAudit()}>Run comparability audit</button> : <>
          <p className="boundary-note">Temporary audit · confidence {audit.confidence} · {audit.findings.length} checks</p>
          {audit.findings.map((finding) => <article className="finding" key={finding.id}><div className="finding-icon">{finding.severity === "critical" ? "!" : "i"}</div><div className="finding-body"><h3>{finding.title}</h3><p>{finding.summary}</p><button className="secondary-button" onClick={() => setEvidenceInspected(true)}>Inspect {finding.evidence_ref_ids.length} cited sources</button>{evidenceInspected && <div className="evidence-grid">{audit.evidence_refs.filter((ref) => finding.evidence_ref_ids.includes(ref.id)).map((ref) => <code key={ref.id}>{ref.level} · {ref.source_path}{ref.json_pointer} = {String(ref.observed_value ?? "unknown")}</code>)}</div>}</div></article>)}
          {!investigationId ? <button disabled={busy} onClick={saveAudit}>Save complete audit and create investigation</button> : <span className="saved-label">Audit package saved · revision 1</span>}
        </>}
      </section>
      {investigationId && revision === 1 && <section className="challenge-panel action-required" id="persistent-challenge"><div className="action-required-header"><div><p className="eyebrow">Researcher challenge</p><h2>Revise interpretation, retain evidence</h2></div><span className="action-required-badge">Action required</span></div><p className="action-instruction" id="researcher-context-help"><strong>Your turn:</strong> Explain the intended use or context for this result. Your note may revise the interpretation, but it cannot remove the cited evidence.</p><label className="required-label" htmlFor="researcher-context">Researcher context <span>Required</span></label><textarea aria-describedby="researcher-context-help" id="researcher-context" placeholder={challengeExample} required value={challengeText} onChange={(event) => { setChallengeText(event.target.value); setChallengePreview(null); }} />{sampleChallengeSuggestion && <aside className="sample-context-helper"><span>Prepared sample helper</span><p>{sampleChallengeSuggestion}</p><button className="secondary-button" onClick={() => { setChallengeText(sampleChallengeSuggestion); setChallengePreview(null); }} type="button">Use this sample context</button></aside>}{!challengePreview ? <button disabled={!challengeText.trim()} onClick={() => setChallengePreview(createChallengePreview(challengeText, primary?.id, primary))}>Preview my revised interpretation</button> : <div className="challenge-diff"><p>{challengePreview.proposedInterpretation}</p><p className="retained"><strong>Retained limitation:</strong> {challengePreview.retainedLimitation}</p><button disabled={busy} onClick={confirmChallenge}>Confirm challenge and revision</button></div>}</section>}
      {revision >= 2 && <section className="plan-panel" id="persistent-plan"><p className="eyebrow">Whole-audit reevaluation plan</p><h2>Run A is prefilled to the Run B baseline</h2><div className="plan-grid">
        <label>Run A candidate pool<input aria-label="Run A candidate pool" disabled={!!savedPlan} type="number" value={plan.candidatePoolA} onChange={(e) => setPlan({ ...plan, candidatePoolA: Number(e.target.value) })} /></label><label>Run B candidate pool<input aria-label="Run B candidate pool" disabled={!!savedPlan} type="number" value={plan.candidatePoolB} onChange={(e) => setPlan({ ...plan, candidatePoolB: Number(e.target.value) })} /></label>
        <label>Run A split<input disabled={!!savedPlan} value={plan.evaluationSplitA} onChange={(e) => setPlan({ ...plan, evaluationSplitA: e.target.value })} /></label><label>Run B split<input disabled={!!savedPlan} value={plan.evaluationSplitB} onChange={(e) => setPlan({ ...plan, evaluationSplitB: e.target.value })} /></label>
        <label>Run A preprocessing<input disabled={!!savedPlan} value={plan.preprocessingA} onChange={(e) => setPlan({ ...plan, preprocessingA: e.target.value })} /></label><label>Run B preprocessing<input disabled={!!savedPlan} value={plan.preprocessingB} onChange={(e) => setPlan({ ...plan, preprocessingB: e.target.value })} /></label>
        <label>Run A metric definition<input disabled={!!savedPlan} value={plan.metricDefinitionA} onChange={(e) => setPlan({ ...plan, metricDefinitionA: e.target.value })} /></label><label>Run B metric definition<input disabled={!!savedPlan} value={plan.metricDefinitionB} onChange={(e) => setPlan({ ...plan, metricDefinitionB: e.target.value })} /></label>
        <label>Batch size<input aria-label="Batch size" disabled={!!savedPlan} type="number" value={plan.batchSize} onChange={(e) => setPlan({ ...plan, batchSize: Number(e.target.value) })} /></label></div>
        {planValidation.blockingErrors.map((item) => <p className="warning-note" key={item}>{item}</p>)}
        {!savedPlan ? <button disabled={busy || planValidation.readiness === "not_ready"} onClick={savePlan}>Save validated draft</button> : <>{savedPlan.validation.informationalWarnings.map((item) => <p className="info-note" key={item}>{item}</p>)}{savedPlan.validation.limitations.map((item) => <p className="warning-note" key={item}>{item}</p>)}<div className="digest-line"><span>Server-computed exact digest · plan v{savedPlan.plan_version}</span><code>{savedPlan.digest}</code></div><label className="field-label">Approval rationale<textarea id="rationale" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} /></label><button disabled={busy || !rationale.trim()} onClick={approvePlan}>{savedPlan.validation.limitations.length ? "Approve with limitation" : "Approve exact plan"}</button></>}
      </section>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div><aside className="jarvis-rail" aria-label="Persistent investigation assistant"><JarvisAdvisor review={jarvisReview} onNextAction={runJarvisNextAction} />{brief && <section className="jarvis-panel"><p className="eyebrow">Decision brief</p><strong>DRAFT — NOT APPROVED</strong><div><button className="secondary-button" onClick={() => exportBrief("md")}>Download Markdown</button><button className="secondary-button" onClick={() => exportBrief("json")}>Download JSON</button></div></section>}</aside></div>
  </div>;
}
