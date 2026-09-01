import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <p className="eyebrow">Evidence-first experiment decisions</p>
      <h1>Research Audit Workbench</h1>
      <p>Check whether two recorded results support the decision you are about to make.</p>
      <Link className="primary-link" href="/demo">Open the disposable demo</Link>
    </main>
  );
}

