import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: investigations } = await supabase
    .from("investigations")
    .select("id, question, status, updated_at")
    .order("updated_at", { ascending: false });
  const { data: experiments } = await supabase
    .from("experiments")
    .select("id, name, runs(id, name, metrics)")
    .order("created_at", { ascending: false });
  return (
    <main className="workspace-shell">
      <div className="workspace-heading">
        <div><p className="eyebrow">Decision workspace</p><h1>Investigations</h1></div>
        <Link className="primary-link" href="/workspace/imports">Import experiment</Link>
      </div>
      {!investigations?.length ? <div className="empty-workspace"><h2>No investigations yet</h2><p>Import records first. A recorded metric does not establish comparability on its own.</p></div> : (
        <div className="investigation-list">{investigations.map((item) => <Link href={`/workspace/investigations/${item.id}`} key={item.id}><span>{item.status}</span><strong>{item.question}</strong></Link>)}</div>
      )}
      {!!experiments?.length && <section className="imported-experiments"><p className="eyebrow">Imported evidence</p>{experiments.map((experiment) => <article key={experiment.id}><h2>{experiment.name}</h2><div>{experiment.runs.map((run) => <span key={run.id}>{run.name}</span>)}</div><Link className="primary-link" href={`/workspace/investigations/new?experiment=${experiment.id}`}>Start durable investigation</Link></article>)}</section>}
    </main>
  );
}
