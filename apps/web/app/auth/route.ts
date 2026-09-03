import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/server/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const intent = formData.get("intent");
  const requestedNext = String(formData.get("next") ?? "");
  const next = requestedNext.startsWith("/workspace") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/workspace";
  const supabase = await createClient();

  const { error } = intent === "sign-up"
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  const destination = error
    ? `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    : next;

  return NextResponse.redirect(new URL(destination, request.url), 303);
}
