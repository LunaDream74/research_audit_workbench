# Research Audit Workbench

Research Audit Workbench is a WebMCP-enabled decision workspace for ML researchers. It helps a researcher test whether two experiment results are comparable before spending more time or compute on the apparent winner.

The prepared walkthrough compares a run with 84% Recall@5 against a baseline with 76%. A deterministic audit finds that the first run used 200 candidates per query while the baseline used 1,000. The scores remain visible, but the direct ranking is qualified. The researcher can inspect the source manifests, add context, and approve an exact matched reevaluation plan.

[Open the public demo](https://webmcp-research-auditor.vercel.app/demo)

## What WebMCP does

The page registers six tools through `document.modelContext.registerTool(...)`:

- `get_current_comparison` reads the selected runs, decision question, and evidence availability.
- `run_comparability_audit` starts a deterministic audit for the current selection.
- `show_finding_evidence` focuses the recorded evidence behind a finding.
- `stage_challenge_revision` previews a revised interpretation with the factual limitation retained.
- `stage_resolution_plan` previews a matched reevaluation plan.
- `review_investigation_readiness` compares live evidence, interpretation, and plan state, scores decision readiness, and ranks the next improvements.

These tools can inspect live page state and stage reversible changes. They cannot confirm an import, save a finding, persist a challenge, approve a plan, delete data, or launch an experiment. Those actions remain explicit human decisions.

The JARVIS advisor uses the same deterministic readiness review in both the public demo and signed-in investigation flow. It can stage reversible work or focus the exact researcher control required next; it cannot click a durable action on the researcher's behalf.

Chrome without WebMCP support keeps the same manual walkthrough. A WebMCP-enabled browser exposes all six tools to its agent.

## Architecture

- `apps/web`: Next.js App Router UI, WebMCP adapter, Supabase SSR auth, and human-only durable Route Handlers
- `apps/api`: stateless FastAPI service for bounded package parsing, deterministic audits, and plan validation
- `packages/contracts`: generated TypeScript contracts from the FastAPI OpenAPI document
- `supabase`: PostgreSQL migrations, row-level security policies, immutable approval constraints, and local seed data
- `demo/retrieval-package`: prepared source records used by the public disposable walkthrough

The FastAPI service has no database credentials. The Next.js server is the only durable-write owner. Approved plans store a server-computed SHA-256 digest and cannot be edited in place.

## Run locally

Prerequisites: Node.js 20 or newer, Python 3.12 or newer, [uv](https://docs.astral.sh/uv/), Docker, and the Supabase CLI.

1. Install dependencies.

   ```powershell
   npm install
   uv sync --project apps/api --dev
   ```

2. Start local Supabase and copy the local URL and publishable key into `.env.local` using `.env.example` as the field list.

   ```powershell
   npx supabase start
   ```

3. Start the API.

   ```powershell
   uv run --project apps/api uvicorn app:app --reload --port 8000
   ```

4. Start the web app in a second terminal.

   ```powershell
   npm run dev
   ```

5. Open `http://127.0.0.1:3000/demo`. For native WebMCP testing in Chrome, enable the relevant experimental WebMCP support before launching the page.

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run contracts:check
npm run test:e2e
uv run --project apps/api pytest
uv run --project apps/api ruff check .
```

The deployed P0 was also exercised through public signup, prepared import, audit, evidence inspection, challenge confirmation, exact approval, reload, and resume. See [deployment notes](docs/deployment.md) and the [build journal](docs/hackathon-build/build-notes.md).

## Current limits

- Candidate-pool mismatch is the deepest audit rule in this submission.
- Full-fidelity import supports the documented prepared retrieval package rather than arbitrary experiment folders.
- The product approves a plan but does not execute training or evaluation jobs.
- WebMCP is experimental, so the adapter feature-detects support and preserves a manual path.

## License

[MIT](LICENSE)
