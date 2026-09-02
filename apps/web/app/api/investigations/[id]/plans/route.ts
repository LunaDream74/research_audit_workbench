import { NextResponse } from "next/server";
import { digestPlan, type ResolutionPlan, validatePlan } from "@/src/domain/investigation";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(body.expectedRevision) || typeof body.plan !== "object") {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  const { data: versions, error: versionError } = await supabase
    .from("plan_versions").select("version").eq("investigation_id", id).order("version", { ascending: false }).limit(1);
  if (versionError) return NextResponse.json({ error: "plan_lookup_failed" }, { status: 400 });
  const plan = { ...(body.plan as ResolutionPlan), version: (versions?.[0]?.version ?? 0) + 1 };
  const validation = validatePlan(plan);
  if (validation.blockingErrors.length) {
    return NextResponse.json({ error: "plan_not_ready", validation }, { status: 422 });
  }
  const digest = await digestPlan(plan);
  const { data, error } = await supabase.rpc("save_investigation_plan", {
    target_investigation: id,
    expected_revision: body.expectedRevision,
    plan_body: plan,
    plan_warnings: validation,
    plan_digest: digest,
  });
  if (error) {
    const stale = error.message.includes("stale analysis revision");
    return NextResponse.json({ error: stale ? "stale_analysis_revision" : "plan_save_failed", detail: error.message }, { status: stale ? 409 : 400 });
  }
  return NextResponse.json({ ...data, plan, validation, digest }, { status: 201 });
}
