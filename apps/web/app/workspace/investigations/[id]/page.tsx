import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/src/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: investigation } = await supabase.from("investigations")
    .select("id, question, status, run_a_id, run_b_id, updated_at").eq("id", id).single();
  if (!investigation) notFound();
  const [{ data: runs }, { data: revisions }, { data: plans }, { data: events }] = await Promise.all([
    supabase.from("runs").select("id, name, metrics").in("id", [investigation.run_a_id, investigation.run_b_id]),
    supabase.from("analysis_revisions").select("revision, finding_snapshot, created_at").eq("investigation_id", id).order("revision"),
    supabase.from("plan_versions").select("version, status, body, digest, rationale, approved_at").eq("investigation_id", id).order("version"),
    supabase.from("investigation_events").select("event_type, payload, created_at").eq("investigation_id", id).order("created_at"),
  ]);
  const approved = plans?.find((plan) => plan.status !== "draft");
  return <main className="workspace-shell investigation-detail">
    <div className="workspace-heading"><div><p className="eyebrow">Durable decision record</p><h1>{investigation.question}</h1></div><span className="step-chip">{investigation.status}</span></div>
    <section className="comparison-panel"><h2>Selected evidence</h2><div className="run-preview-grid">{runs?.map((run) => <article key={run.id}><strong>{run.name}</strong><span>{JSON.stringify(run.metrics)}</span></article>)}</div></section>
    <section className="challenge-panel"><h2>Interpretation history</h2>{revisions?.map((revision) => <article key={revision.revision}><strong>Analysis revision {revision.revision}</strong><pre>{JSON.stringify(revision.finding_snapshot, null, 2)}</pre></article>)}</section>
    {approved && <section className="approval-history"><p className="eyebrow">Immutable approval</p><h2>Plan v{approved.version} · {approved.status}</h2><p>{approved.rationale}</p><div className="digest-line"><span>Exact approved digest</span><code>{approved.digest}</code></div><pre>{JSON.stringify(approved.body, null, 2)}</pre></section>}
    <section className="history-panel"><h2>Append-only history</h2><ol>{events?.map((event, index) => <li key={`${event.created_at}-${index}`}><strong>{event.event_type}</strong><span>{new Date(event.created_at).toLocaleString()}</span></li>)}</ol></section>
    <p className="boundary-note">Reload restores this record. No audit, agent action, or experiment execution resumes automatically.</p>
    <Link className="primary-link" href="/workspace">Back to investigations</Link>
  </main>;
}
