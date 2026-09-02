import { NextResponse } from "next/server";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(body.expectedRevision) || typeof body.challengePreview !== "object") {
    return NextResponse.json({ error: "invalid_challenge_confirmation" }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("confirm_investigation_challenge", {
    target_investigation: id,
    expected_revision: body.expectedRevision,
    challenge_preview: body.challengePreview,
  });
  if (error) {
    const stale = error.message.includes("stale analysis revision");
    return NextResponse.json({ error: stale ? "stale_analysis_revision" : "challenge_confirm_failed", detail: error.message }, { status: stale ? 409 : 400 });
  }
  return NextResponse.json(data);
}
