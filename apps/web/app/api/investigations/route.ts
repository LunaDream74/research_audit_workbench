import { NextResponse } from "next/server";
import { comparisonDigest, trustedRunSnapshot } from "@/src/domain/audit";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.runAId !== "string" || typeof body.runBId !== "string"
      || typeof body.question !== "string" || typeof body.selectionDigest !== "string"
      || typeof body.auditResult !== "object" || typeof body.findingSnapshot !== "object") {
    return NextResponse.json({ error: "invalid_investigation_intent" }, { status: 400 });
  }
  const { data: runs, error: runError } = await supabase.from("runs")
    .select("id, name, metrics, config, source_snapshot").eq("owner_id", userData.user.id)
    .in("id", [body.runAId, body.runBId]);
  if (runError || runs?.length !== 2) return NextResponse.json({ error: "owned_run_pair_not_found" }, { status: 404 });
  const byId = new Map(runs.map((run) => [run.id, run]));
  const ordered = [byId.get(body.runAId), byId.get(body.runBId)];
  if (ordered.some((run) => !run)) return NextResponse.json({ error: "owned_run_pair_not_found" }, { status: 404 });
  const trustedDigest = await comparisonDigest(body.question, ordered.map((run) => trustedRunSnapshot(run!)));
  const audit = body.auditResult as Record<string, unknown>;
  if (trustedDigest !== body.selectionDigest || audit.selection_digest !== trustedDigest
      || !Array.isArray(audit.findings) || !Array.isArray(audit.evidence_refs)) {
    return NextResponse.json({ error: "stale_or_incomplete_audit_package" }, { status: 409 });
  }
  const { data, error } = await supabase.rpc("create_investigation_from_finding", {
    run_a: body.runAId,
    run_b: body.runBId,
    question: body.question,
    selection_digest: body.selectionDigest,
    audit_result: body.auditResult,
    finding_snapshot: body.findingSnapshot,
  });
  if (error) return NextResponse.json({ error: "investigation_create_failed", detail: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
