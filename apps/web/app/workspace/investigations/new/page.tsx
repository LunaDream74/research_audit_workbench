import { redirect } from "next/navigation";
import { PersistentInvestigation } from "../persistent-investigation";
import { createClient } from "@/src/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewInvestigationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/login");
  const { data: runs } = await supabase.from("runs")
    .select("id, name, metrics, config, source_snapshot").order("created_at", { ascending: true }).limit(2);
  if (!runs || runs.length < 2) redirect("/workspace/imports");
  return <main className="workspace-shell"><PersistentInvestigation runs={runs} /></main>;
}
