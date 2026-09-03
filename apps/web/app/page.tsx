import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <p className="eyebrow">Evidence-first experiment decisions</p>
      <h1>Research Audit Workbench</h1>
      <p>Import two recorded ML runs, audit whether their results are actually comparable, and export a decision brief bound to human approval.</p>
      <div className="landing-actions">
        <Link className="primary-link" href="/workspace/imports">Audit your own runs</Link>
        <Link className="secondary-link" href="/demo">Explore the disposable demo</Link>
      </div>
      <section className="landing-proof" aria-label="Product workflow">
        <article><span>01</span><strong>Import evidence</strong><p>Review a prepared ZIP before any owner-scoped records are saved.</p></article>
        <article><span>02</span><strong>Audit comparability</strong><p>Check candidate pools, splits, preprocessing, metrics, and missing sources.</p></article>
        <article><span>03</span><strong>Approve the decision</strong><p>Challenge findings, match conditions, and export a digest-bound brief.</p></article>
      </section>
      <div className="sample-options">
        <p>No package ready? Take either sample through the authenticated product:</p>
        <a download href="/research-audit-metric-definition-sample.zip"><strong>Subtle audit</strong><span>Same benchmark and metric label; incompatible aggregation definitions.</span></a>
        <a download href="/research-audit-sample.zip"><strong>Introductory audit</strong><span>A clear candidate-pool mismatch that demonstrates the safety boundary.</span></a>
      </div>
    </main>
  );
}
