"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JarvisAdvisor } from "@/components/jarvis-advisor";
import {
  createChallengePreview,
  createResolutionPlan,
  type ChallengePreview,
  type ResolutionPlan,
  validatePlan,
} from "@/src/domain/investigation";
import { reviewInvestigation } from "@/src/domain/jarvis-review";

type RunRecord = { id: string; name: string; metrics: unknown; config: unknown; source_snapshot: unknown };
type SavedPlan = { plan_version: number; digest: string; plan: ResolutionPlan; validation: { limitations: string[]; informationalWarnings: string[] } };

const question = "Does this apparent improvement justify another training run?";

export function PersistentInvestigation({ runs }: { runs: RunRecord[] }) {
  const router = useRouter();
  const [investigationId, setInvestigationId] = useState("");
  const [revision, setRevision] = useState(0);
  const [challengeText, setChallengeText] = useState("The smaller pool was an intentional sanity check.");
  const [challengePreview, setChallengePreview] = useState<ChallengePreview | null>(null);
  const [plan, setPlan] = useState<ResolutionPlan>(() => createResolutionPlan());
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [rationale, setRationale] = useState("This matched reevaluation resolves the decision-relevant mismatch without additional training.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectionDigest = `owned:${runs[0].id}:${runs[1].id}`;
  const planValidation = useMemo(() => validatePlan(plan), [plan]);
  const jarvisReview = useMemo(() => reviewInvestigation({
    pairReady: true,
    auditComplete: true,
    evidenceInspected: true,
    findingSaved: Boolean(investigationId),
    challengePreviewed: Boolean(challengePreview),
    challengeConfirmed: revision >= 2,
    planDrafted: revision >= 2,
    planValidation: revision >= 2 ? planValidation : null,
    digestReady: Boolean(savedPlan),
    approved: false,
  }), [challengePreview, investigationId, planValidation, revision, savedPlan]);

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
      case "stage_challenge":
        setChallengePreview(createChallengePreview(challengeText));
        focusControl("persistent-challenge");
        break;
      case "save_finding":
        focusControl("persistent-finding");
        break;
      case "confirm_challenge":
        focusControl("persistent-challenge");
        break;
      case "fix_plan":
      case "save_plan":
      case "approve_plan":
        focusControl("persistent-plan");
        break;
      default:
        focusControl("persistent-finding");
    }
  }

  async function call(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.detail ?? result.error ?? "Request failed");
        return null;
      }
      return result;
    } catch {
      setError("The request could not be completed. Your current record is unchanged.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveFinding() {
    const auditResult = {
      metrics: runs.map((run) => ({ run_id: run.id, ...((run.metrics as object) ?? {}) })),
      limitations: ["The candidate-pool mismatch does not quantify the cause of the recorded score gap."],
    };
    const result = await call("/api/investigations", {
      runAId: runs[0].id, runBId: runs[1].id, question, selectionDigest, auditResult,
      findingSnapshot: {
        id: "candidate-pool-mismatch", title: "Different evaluation conditions",
        summary: "Run A used 200 candidates and Run B used 1,000; direct ranking is unsupported.",
        retainedLimitation: "The score gap cannot be causally attributed to candidate-pool size.",
      },
    });
    if (result) { setInvestigationId(result.investigation_id); setRevision(result.analysis_revision); }
  }

  async function confirmChallenge() {
    if (!challengePreview) return;
    const result = await call(`/api/investigations/${investigationId}/challenges`, {
      expectedRevision: revision, challengePreview,
    });
    if (result) setRevision(result.analysis_revision);
  }

  async function savePlan() {
    const result = await call(`/api/investigations/${investigationId}/plans`, { expectedRevision: revision, plan });
    if (result) { setSavedPlan(result); setPlan(result.plan); }
  }

  async function approvePlan() {
    if (!savedPlan) return;
    const result = await call(`/api/investigations/${investigationId}/plans/${savedPlan.plan_version}/approve`, {
      digest: savedPlan.digest,
      rationale,
      acknowledgedLimitation: savedPlan.validation.limitations[0] ?? null,
    });
    if (result) router.push(`/workspace/investigations/${investigationId}`);
  }

  return (
    <div className="persistent-flow" aria-busy={busy}>
      <div className="workspace-heading"><div><p className="eyebrow">Persistent control room</p><h1>Turn evidence into a durable decision</h1></div><span className="step-chip">Human confirmation only</span></div>
      <JarvisAdvisor review={jarvisReview} onNextAction={runJarvisNextAction} />
      <section className="comparison-panel" id="persistent-finding">
        <h2>{question}</h2>
        <div className="run-preview-grid">{runs.map((run) => <article key={run.id}><strong>{run.name}</strong><span>{JSON.stringify(run.metrics)}</span></article>)}</div>
        <div className="finding"><div className="finding-icon">!</div><div className="finding-body"><h3>Different evaluation conditions</h3><p>Run A used 200 candidates and Run B used 1,000. Both scores remain visible, but direct ranking is unsupported.</p>
          {!investigationId ? <button disabled={busy} onClick={saveFinding}>Save finding and create investigation</button> : <span className="saved-label">✓ Finding confirmed · revision 1</span>}
        </div></div>
      </section>

      {investigationId && revision === 1 && <section className="challenge-panel" id="persistent-challenge">
        <p className="eyebrow">Researcher challenge</p><h2>Revise the interpretation, retain the evidence</h2>
        <textarea aria-label="Researcher context" onChange={(event) => setChallengeText(event.target.value)} value={challengeText} />
        {!challengePreview ? <button onClick={() => setChallengePreview(createChallengePreview(challengeText))}>Preview revised interpretation</button> : <div className="challenge-diff"><p>{challengePreview.proposedInterpretation}</p><p className="retained"><strong>Retained limitation:</strong> {challengePreview.retainedLimitation}</p><button disabled={busy} onClick={confirmChallenge}>Confirm challenge and revision</button></div>}
      </section>}

      {revision >= 2 && <section className="plan-panel" id="persistent-plan">
        <p className="eyebrow">Versioned resolution plan</p><h2>Approve only the exact matched reevaluation</h2>
        <div className="plan-grid">
          <label>Run A candidate pool<input aria-label="Run A candidate pool" disabled={!!savedPlan} type="number" value={plan.candidatePoolA} onChange={(event) => setPlan({ ...plan, candidatePoolA: Number(event.target.value) })} /></label>
          <label>Run B candidate pool<input aria-label="Run B candidate pool" disabled={!!savedPlan} type="number" value={plan.candidatePoolB} onChange={(event) => setPlan({ ...plan, candidatePoolB: Number(event.target.value) })} /></label>
          <label>Batch size<input aria-label="Batch size" disabled={!!savedPlan} type="number" value={plan.batchSize} onChange={(event) => setPlan({ ...plan, batchSize: Number(event.target.value) })} /></label>
        </div>
        {!savedPlan ? <button disabled={busy} onClick={savePlan}>Save validated draft</button> : <>
          {savedPlan.validation.informationalWarnings.map((warning) => <p className="info-note" key={warning}>{warning}</p>)}
          {savedPlan.validation.limitations.map((warning) => <p className="warning-note" key={warning}>{warning}</p>)}
          <div className="digest-line"><span>Server-computed exact digest · plan v{savedPlan.plan_version}</span><code>{savedPlan.digest}</code></div>
          <label className="field-label">Approval rationale<input id="rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} /></label>
          <button disabled={busy || !rationale.trim()} onClick={approvePlan}>{savedPlan.validation.limitations.length ? "Approve with limitation" : "Approve exact plan"}</button>
        </>}
      </section>}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  );
}
