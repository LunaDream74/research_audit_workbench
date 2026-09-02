import { NextResponse } from "next/server";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.runAId !== "string" || typeof body.runBId !== "string"
      || typeof body.question !== "string" || typeof body.selectionDigest !== "string"
      || typeof body.auditResult !== "object" || typeof body.findingSnapshot !== "object") {
    return NextResponse.json({ error: "invalid_investigation_intent" }, { status: 400 });
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
