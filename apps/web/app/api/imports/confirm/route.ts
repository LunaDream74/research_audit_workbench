import { NextResponse } from "next/server";
import { analysisApiUrl } from "@/src/server/analysis-api";
import { createClient } from "@/src/server/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: session } = await supabase.auth.getSession();
  if (!userData.user || !session.session?.access_token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }
  const incoming = await request.formData();
  const file = incoming.get("package");
  const expectedDigest = String(incoming.get("digest") ?? "");
  if (!(file instanceof File) || !expectedDigest) {
    return NextResponse.json({ error: "package_and_digest_required" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "package_exceeds_10_mb" }, { status: 413 });
  }
  const forwarded = new FormData();
  forwarded.set("package", file, file.name);
  forwarded.set("schema_version", "1.0");
  const previewResponse = await fetch(`${analysisApiUrl()}/v1/imports/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.session.access_token}` },
    body: forwarded,
    cache: "no-store",
  });
  const preview = await previewResponse.json().catch(() => null);
  if (!previewResponse.ok || !preview) {
    return NextResponse.json(preview ?? { error: "preview_revalidation_failed" }, { status: previewResponse.status });
  }
  if (preview.digest !== expectedDigest) {
    return NextResponse.json({ error: "preview_digest_changed" }, { status: 409 });
  }
  const { data, error } = await supabase.rpc("confirm_prepared_import", {
    preview,
    source_name: file.name,
    expected_digest: expectedDigest,
  });
  if (error) {
    return NextResponse.json({ error: "confirmation_failed", detail: error.message }, { status: 400 });
  }
  return NextResponse.json({ status: "confirmed", ...(data as Record<string, unknown>) });
}
