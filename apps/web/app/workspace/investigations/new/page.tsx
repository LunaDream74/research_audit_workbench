import { redirect } from "next/navigation";
import { PersistentInvestigation } from "../persistent-investigation";
import { createClient } from "@/src/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewInvestigationPage({ searchParams }: { searchParams: Promise<{ experiment?: string }> }) {
  const { experiment } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!experiment) redirect("/workspace/imports");
  const { data: runs } = await supabase.from("runs")
    .select("id, name, metrics, config, source_snapshot")
    .eq("experiment_id", experiment)
    .order("created_at", { ascending: true });
  if (!runs || runs.length < 2) redirect("/workspace/imports");
  return <main className="workspace-shell persistent-workspace-shell"><PersistentInvestigation runs={runs} /></main>;
}
