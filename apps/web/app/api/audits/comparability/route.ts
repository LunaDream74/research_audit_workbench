import { NextResponse } from "next/server";
import { comparisonDigest, trustedRunSnapshot } from "@/src/domain/audit";
import { analysisApiUrl } from "@/src/server/analysis-api";
import { createClient } from "@/src/server/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const token = sessionData.session?.access_token;
  if (!userData.user || !token) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.runAId !== "string" || typeof body.runBId !== "string"
      || body.runAId === body.runBId || typeof body.question !== "string"
      || typeof body.selectionDigest !== "string") {
    return NextResponse.json({ error: "invalid_comparison" }, { status: 400 });
  }
  const { data: records, error } = await supabase.from("runs")
    .select("id, name, metrics, config, source_snapshot")
    .eq("owner_id", userData.user.id)
    .in("id", [body.runAId, body.runBId]);
  if (error || records?.length !== 2) return NextResponse.json({ error: "owned_run_pair_not_found" }, { status: 404 });
  const byId = new Map(records.map((record) => [record.id, record]));
  const selected = [byId.get(body.runAId), byId.get(body.runBId)];
  if (selected.some((run) => !run)) return NextResponse.json({ error: "owned_run_pair_not_found" }, { status: 404 });
  const runs = selected.map((run) => trustedRunSnapshot(run!));
  const digest = await comparisonDigest(body.question, runs);
  if (digest !== body.selectionDigest) {
    return NextResponse.json({ error: "stale_selection_digest", selectionDigest: digest }, { status: 409 });
  }

  const response = await fetch(`${analysisApiUrl()}/v1/audits/comparability`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ selection_digest: digest, question: body.question, run_a: runs[0], run_b: runs[1] }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  return NextResponse.json(result ?? { error: "analysis_api_unavailable" }, { status: response.status });
}
