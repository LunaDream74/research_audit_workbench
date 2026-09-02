import { NextResponse } from "next/server";
import { analysisApiUrl } from "@/src/server/analysis-api";
import { createClient } from "@/src/server/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: session } = await supabase.auth.getSession();
  if (!claims?.claims || !session.session?.access_token) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }
  const incoming = await request.formData();
  const file = incoming.get("package");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "zip_package_required" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "package_exceeds_10_mb" }, { status: 413 });
  }
  const forwarded = new FormData();
  forwarded.set("package", file, file.name);
  forwarded.set("schema_version", String(incoming.get("schema_version") ?? "1.0"));
  const response = await fetch(`${analysisApiUrl()}/v1/imports/preview`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.session.access_token}` },
    body: forwarded,
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({ detail: "analysis_api_unavailable" }));
  return NextResponse.json(body, { status: response.status });
}
