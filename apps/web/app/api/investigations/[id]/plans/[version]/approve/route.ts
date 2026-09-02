import { NextResponse } from "next/server";
import { digestPlan, type ResolutionPlan, validatePlan } from "@/src/domain/investigation";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version: rawVersion } = await params;
  const version = Number(rawVersion);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.digest !== "string" || typeof body.rationale !== "string" || !Number.isInteger(version)) {
    return NextResponse.json({ error: "invalid_approval" }, { status: 400 });
  }
  const { data: stored, error: lookupError } = await supabase.from("plan_versions")
    .select("body, digest, status").eq("investigation_id", id).eq("version", version).single();
  if (lookupError || !stored) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
  if (stored.status !== "draft" || stored.digest !== body.digest) {
    return NextResponse.json({ error: "stale_plan_version_or_digest" }, { status: 409 });
  }
  const plan = stored.body as ResolutionPlan;
  const validation = validatePlan(plan);
  const digest = await digestPlan(plan);
  if (validation.blockingErrors.length || digest !== stored.digest) {
    return NextResponse.json({ error: "server_revalidation_failed", validation }, { status: 409 });
  }
  const limitation = validation.limitations[0] ?? null;
  if (limitation && body.acknowledgedLimitation !== limitation) {
    return NextResponse.json({ error: "specific_limitation_acknowledgment_required", limitation }, { status: 422 });
  }
  const approvalStatus = limitation ? "approved_with_limitation" : "approved";
  const { data, error } = await supabase.rpc("approve_investigation_plan", {
    target_investigation: id,
    expected_version: version,
    expected_digest: digest,
    approval_status: approvalStatus,
    approval_rationale: body.rationale,
    acknowledged_limitation: limitation,
  });
  if (error) {
    const stale = error.message.includes("stale plan version or digest");
    return NextResponse.json({ error: stale ? "stale_plan_version_or_digest" : "approval_failed", detail: error.message }, { status: stale ? 409 : 400 });
  }
  return NextResponse.json({ ...data, validation });
}
