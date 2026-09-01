# Technical Spec

## Overview

The MVP is a WebMCP-enabled investigation workbench for comparing two ML experiment runs. It imports a prepared retrieval package, preserves provenance, exposes the researcher's live comparison to an external browser agent, runs deterministic comparability checks, and lets the researcher explicitly confirm findings, challenges, and an exact reevaluation plan.

Protected demo transformation: `84% appears better than 76%` -> `candidate-pool evidence makes the comparison inconclusive` -> `the researcher challenges the interpretation` -> `an exact matched reevaluation plan is approved`.

The 36-hour build targets a public disposable `/demo` and a private persistent workspace. It does not call a model API or execute experiments. The external browser agent interprets and drafts; application code supplies facts, evidence, validation, and durable state transitions.

### Priority Contract

- **P0:** disposable demo, email/password auth, prepared ZIP import/review/confirmation, two-run control room, five WebMCP tools, candidate-pool audit, evidence inspection, confirmed challenge, versioned plan validation/approval, investigation resume, two deployments, and hero-path tests.
- **P1 after P0 works:** partial/failed import activity, duplicate reuse, interrupted/stale revisions, one-run review, and lighter audit rules.
- **P2 deferred:** generic import breadth, advanced deletion/redaction, copying demo data, warm theme, complete status controls, remote execution, and teams.

## Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Web/BFF | Next.js App Router, React, TypeScript | One UI with server rendering and Route Handlers. |
| UI | Tailwind, shadcn/ui, TanStack Table | Fast guided and dense control-room views. |
| Validation | Zod and Pydantic | Runtime validation on both sides of HTTP. |
| Data | Supabase Auth, PostgreSQL, Storage | Cookie auth, RLS ownership, relational history, small artifacts. |
| Analysis | FastAPI on Python 3.12+, `uv` | Stateless, deterministic Python parsing and ML checks. |
| Contracts | FastAPI OpenAPI -> generated TypeScript | One HTTP contract source. |
| Agent bridge | WebMCP behind one adapter | Isolates an experimental browser API. |
| Deploy | Two Vercel projects from one monorepo | Stable Next.js/FastAPI separation. |
| Tests | Pytest, Vitest, Playwright | Rules, UI/domain behavior, and one hero journey. |

Pin exact versions in lockfiles. Feature-detect WebMCP and preserve a normal UI path for every durable action.

## Architecture

### Next.js Web Application

Implements: `prd.md > Epics 1, 3, 5, 6, 7, 8`.

App Router pages render the workspace; Client Components own selection, temporary audits, evidence drawers, challenge previews, and plan editing. Route Handlers authenticate, validate intent, check ownership, and perform all durable writes through user-scoped Supabase clients. No service-role key reaches the browser.

### Supabase Auth, Database, and Storage

Implements: `prd.md > Epics 2, 6, 7, 8`.

Cookie-backed SSR auth identifies the researcher. RLS requires `owner_id = auth.uid()` for all private rows. Storage accepts manifests, configs, metadata, and small evidence artifacts. Packages are capped at 10 MB; checkpoint binaries are rejected while paths and hashes remain as references.

### Stateless FastAPI Analysis Service

Implements: `prd.md > Epics 2, 5` and plan validation in `Epic 7`.

FastAPI parses packages, proposes normalization, runs deterministic audits, constructs citations, and validates plans. It receives bounded snapshots, returns structured results, has no database credentials, and performs no durable writes. Private endpoints verify the Supabase bearer JWT.

### WebMCP Adapter and Tool Registry

Implements: `prd.md > Epic 4` and agent-assisted parts of `Epics 5-7`.

Only `apps/web/src/webmcp/adapter.ts` touches `document.modelContext`. It feature-detects support, registers schema-validated tools, aborts registration when route/selection changes, and maps errors to concise tool results. Tools expose live context and reversible previews only. They cannot confirm imports, create findings, persist challenges, approve plans, delete data, or launch work.

### Deterministic Audit Engine

Implements: `prd.md > Epic 5`.

Pure Python rules compare normalized snapshots. P0 checks candidate-pool counts using recorded manifests before declared configuration, preserves both sources, and creates a separate inconsistency when they disagree. It retains both metrics and never estimates how much of a score gap the mismatch caused. P1 adds split, preprocessing, and metric-definition checks with `recorded`, `declared`, or `unknown` evidence levels.

### Investigation and Approval Domain

Implements: `prd.md > Epics 6-8`.

The investigation is the durable aggregate. Temporary agent output stays in browser state until the researcher confirms the first finding. Approved plans are immutable; later edits fork a new draft. Approval stores a server-computed SHA-256 digest of the canonical plan and warnings, exact version, actor, timestamp, rationale, and acknowledged limitation.

### Demo Fixture and Walkthrough

Implements: `prd.md > Story 1.2` and submission proof points.

Public `/demo` loads a versioned, read-only fixture: Run A at 84% Recall@5 with 200 candidates and Run B at 76% with 1,000. It supports the visual journey in memory without private database writes. It includes configs, manifests, a distractor example, and an editable plan, with `Demo data` always visible.

## File Structure

```text
webmcp-hackathon/
|-- AGENTS.md                         # Repository-wide Codex boundaries.
|-- CLAUDE.md                         # Repository routing for Claude Code.
|-- package.json                      # npm workspaces and shared scripts.
|-- docs/hackathon-build/             # Scope, PRD, spec, checklist, journal.
|-- apps/
|   |-- web/
|   |   |-- AGENTS.md                 # Web/auth/human-confirmation rules.
|   |   |-- CLAUDE.md                 # Web package map.
|   |   |-- app/
|   |   |   |-- (public)/demo/        # Disposable walkthrough.
|   |   |   |-- (auth)/login/         # Email/password auth.
|   |   |   |-- (workspace)/imports/  # Upload, review, confirm.
|   |   |   |-- (workspace)/runs/     # Guided and dense selection.
|   |   |   |-- (workspace)/investigations/[id]/ # Decision record.
|   |   |   `-- api/                  # Authenticated durable writes.
|   |   |-- components/               # Tables, cards, drawers, dialogs.
|   |   |-- src/
|   |   |   |-- domain/               # State transitions/invariants.
|   |   |   |-- server/               # Supabase repos and API client.
|   |   |   |-- webmcp/               # Adapter, schemas, registrations.
|   |   |   `-- demo/                 # Fixtures/in-memory state.
|   |   `-- tests/                    # Vitest and Playwright.
|   `-- api/
|       |-- AGENTS.md                 # Stateless/evidence rules.
|       |-- CLAUDE.md                 # API package map.
|       |-- pyproject.toml            # Python dependencies.
|       |-- app.py                    # Vercel ASGI entry.
|       |-- src/
|       |   |-- routes/               # Preview, audit, validate, health.
|       |   |-- schemas/              # Pydantic contracts.
|       |   |-- importers/            # Safe ZIP/provenance parsing.
|       |   |-- audits/               # Pure rules/citations.
|       |   |-- plans/                # Plan validation.
|       |   `-- auth/                 # JWT verification.
|       `-- tests/                    # Pytest fixtures/contracts.
|-- packages/contracts/
|   |-- openapi.json                  # Generated, never hand-edited.
|   `-- src/generated.ts              # Generated TypeScript types.
|-- supabase/
|   |-- migrations/                   # Tables, indexes, RLS, policies.
|   `-- seed.sql                      # Local-only fixtures.
`-- demo/retrieval-package/           # Source fixture and expected snapshot.
```

## Data Model

Private tables include UUID identity, `owner_id`, timestamps, RLS, and indexes for owner/list queries.

| Table | Key fields | Responsibility |
| --- | --- | --- |
| `import_attempts` | status, source, file inventory/warnings/preview JSON | Preview and failure provenance. |
| `experiments` | name, description | Group runs without becoming the decision object. |
| `runs` | experiment, name, metrics/config/readiness/source JSON | Inspectable run evidence. |
| `artifacts` | kind, storage/external path, hash, metadata | Stored evidence or external reference. |
| `run_artifacts` | run, artifact, role, source relation | Attachment provenance. |
| `investigations` | run pair, question, status, active revisions | Durable decision aggregate. |
| `analysis_revisions` | revision, selection digest, status, result/finding JSON | Completed/interrupted/stale audits. |
| `plan_versions` | version, status, body/warnings, digest, approval fields | Drafts and immutable approvals. |
| `investigation_events` | type, actor, payload | Append-only challenge/confirmation/approval history. |

Constraints require two distinct run IDs, unique revision/version numbers, immutable approved plans, and valid statuses. Aggregate-pointer changes and events share a transaction.

## Data Flow

### Prepared Import Lifecycle

1. Authenticated browser enforces the 10 MB limit and sends the package to FastAPI `POST /v1/imports/preview` with a Supabase token.
2. FastAPI rejects unsafe paths, expansion limits, unsupported binaries, and invalid schema; it hashes files and returns a proposed graph with warnings, storing nothing.
3. The UI shows every file, relationship, missing field, ambiguity, and audit-readiness result.
4. Human confirmation calls `POST /api/imports/confirm`.
5. Next.js revalidates preview schema/digest, uploads allowed artifacts, and transactionally persists the confirmed records.
6. The researcher lands in run selection; records survive a new session.

### Audit-to-Approval Lifecycle

1. Selecting exactly two runs computes a selection digest and registers WebMCP tools for that pair.
2. The agent calls `get_current_comparison`, then `run_comparability_audit`.
3. FastAPI returns deterministic findings/citations; the result stays temporary.
4. `show_finding_evidence` opens the side-by-side source view.
5. Human **Save finding and create investigation** creates the investigation, first revision, evidence snapshot, and event transactionally.
6. `stage_challenge_revision` returns a preview; human **Confirm challenge** persists it.
7. `stage_resolution_plan` creates an editable preview; FastAPI validates its variables, inputs, and warnings.
8. Human saves a draft. Approval separately recomputes validation/digest; a limitation requires the specifically named **Approve with limitation** acknowledgment.
9. The transaction locks the plan version, records approval, appends an event, and changes investigation status.

### Return Lifecycle

The authenticated home lists unfinished investigations first. Opening one restores selected snapshots, the latest valid analysis, challenges, versions, approval, and events. No audit or agent action resumes automatically.

## Components And Responsibilities

### Import Preview and Confirmation

Implements: `prd.md > Epic 2`.

Prevent traversal, symlinks, nested archives, excessive counts/depth/expansion, and checkpoint binaries. A preview has a canonical digest. Confirmation rejects missing or changed previews. P0 fully supports only the documented package.

### Run Selection and Control Room

Implements: `prd.md > Epic 3`.

Validate URL-addressable selection against the owner. Never call the highest metric `best` before comparability is established. Guided/dense views retain the pair, question, and selection digest.

### Finding and Evidence Presentation

Implements: `prd.md > Epics 5-6`.

Each `EvidenceRef` identifies artifact, JSON pointer/row locator, evidence level, label, observed value, and source hash. The UI separates recorded evidence, declared config, unknowns, and agent prose. Missing evidence lowers confidence and never becomes a copied source value.

### Plan Versioning and Approval

Implements: `prd.md > Epic 7`.

Approved rows cannot mutate; editing clones `n+1`. Validation separates blocking errors, decision-relevant limitations, and informational warnings. The exact consequence appears in any limitation acknowledgment and approval event.

### Investigation Resume

Implements: `prd.md > Story 8.1`.

P0 activates `unresolved`, `proposal_ready`, `approved`, and `approved_with_limitation`; the schema reserves interrupted, stale, resolved, and archived for P1. Resume loads logical state, never unfinished execution.

## HTTP API Contracts

Pydantic/OpenAPI is authoritative. Generate checked-in TypeScript contracts and fail verification when regeneration creates a diff.

### `POST /v1/imports/preview`

- Multipart request: `package`, `schema_version`; max 10 MB compressed.
- Response: `{ preview_id, digest, files, proposed_experiment, proposed_runs, proposed_artifacts, warnings, audit_readiness }`.
- Errors: malformed `400`, limit `413`, unsupported `415`, no constructible records `422`, auth `401`.

### `POST /v1/audits/comparability`

- Request: `{ selection_digest, question, run_a: RunSnapshot, run_b: RunSnapshot }`.
- Response: `{ revision_id, stages, metrics, findings, evidence_refs, confidence, limitations }`.
- Returns facts and safe explanatory templates, not durable writes.

### `POST /v1/plans/validate`

- Request: `{ investigation_snapshot, plan: ResolutionPlan }`.
- Response: `{ canonical_plan, digest, readiness, blocking_errors, limitations, informational_warnings }`.
- Reintroduced mismatch becomes a named consequence, never silent normalization.

### Next.js Durable Route Handlers

- `POST /api/imports/confirm`
- `POST /api/investigations`
- `POST /api/investigations/:id/challenges`
- `POST /api/investigations/:id/plans`
- `POST /api/investigations/:id/plans/:version/approve`

Every handler rejects cross-owner IDs, stale digests/versions, invalid contracts, and attempts to approve through WebMCP.

## WebMCP Tool Contracts

Register through the adapter with JSON input schemas and versioned JSON-string outputs.

### `get_current_comparison`

Input optionally selects metrics/config/artifact summaries. Output includes bounded run snapshots, question, evidence availability, and selection digest. No side effects.

### `run_comparability_audit`

Input: `{ question?, selectionDigest }`. Output: temporary audit with finding/evidence IDs. Side effect: temporary page state/progress only.

### `show_finding_evidence`

Input: `{ findingId, evidenceRefIds? }`. Output: evidence levels, values, missing notes, source availability. Side effect: focuses the drawer only.

### `stage_challenge_revision`

Input: `{ findingId, researcherContext }`. Output: prior/proposed wording, retained limitation, citations. Human confirmation is required to write.

### `stage_resolution_plan`

Input: `{ investigationId, constraints? }`. Output: editable preview, readiness, missing inputs, assumptions, warnings. Human save/approval is required.

## External APIs And Dependencies

- [WebMCP draft](https://webmachinelearning.github.io/webmcp/) - current `document.modelContext.registerTool(...)`; adapter-isolated.
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - BFF endpoints.
- [Supabase server-side auth](https://supabase.com/docs/guides/auth/server-side) and [Next.js SSR setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework) - cookie sessions and refresh.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) - ownership enforcement.
- [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi) and [Python runtime](https://vercel.com/docs/functions/runtimes/python) - deployment and limits.
- [FastAPI OpenAPI](https://fastapi.tiangolo.com/tutorial/metadata/) - generated contracts.
- [Playwright](https://playwright.dev/docs/intro), [Vitest](https://vitest.dev/guide/), and [Pytest](https://docs.pytest.org/) - verification.

No runtime model API is required. If WebMCP is unavailable, explain browser-agent collaboration is unavailable while preserving the manual UI journey.

## AI Usage

The external agent may inspect context, request deterministic audits, explain findings, preview a challenge, and draft a plan. Its output is always a proposal. Deterministic code calculates mismatches/citations; WebMCP cannot write durable state; the researcher confirms the first finding, revised challenge, saved plan, and exact approval; agent text never becomes evidence.

Codex and Claude Code are development tools, not runtime components. Their roles and verification results belong in folder context and `build-notes.md` for later submission disclosure.

## Risks And Verification

### WebMCP churn or missing support

Isolate the draft API, feature-detect it, abort old registrations, validate inputs, and retain manual UI. Manually verify all five tools in the target browser before secondary polish.

### Demo/private-state confusion

Use a separate fixture loader and in-memory store. Playwright asserts the demo creates no database or storage records.

### Preview-to-write bypass

Durable handlers require auth, current digest/version, ownership, and server revalidation. Test direct, stale, and cross-user attempts.

### Unsafe or over-broad ZIP parsing

Cap compressed/expanded size, file count/depth/types; reject symlinks, traversal, nested archives, and checkpoints. Build the documented schema first.

### Audit overclaims causality

Golden tests require both scores, `ranking not established` wording, recorded-over-declared evidence priority, and no causal estimate.

### Deployment/contract drift

Use explicit origins/env vars, generated types, health checks, and a deployed smoke test across preview, audit, and validation.

### Verification Matrix

| Claim | Checkpoint |
| --- | --- |
| Honest prepared import | Pytest golden plus malformed/traversal/oversize cases. |
| Evidence-backed 200-vs-1,000 result | Pytest rules plus Vitest presentation. |
| Agent sees live pair | Mocked adapter unit plus browser manual check. |
| Pair changes invalidate tools/results | Abort test plus Playwright assertion. |
| Agent cannot persist or approve | Handler auth tests and no write-capable tools. |
| Challenge retains limitation | Domain unit and Playwright confirmation. |
| Approved version is immutable | DB constraint and `n+1` handler test. |
| Return restores decision | Playwright reload/sign-in assertion. |
| Demo is disposable | Playwright journey plus no-write assertion. |

## Demo And Submission Flow

1. Open `/demo`; show 84% vs 76% and select the pair.
2. Ask the external agent whether the gain justifies another run.
3. Agent gets live context and starts the WebMCP audit.
4. Page reveals 200 vs 1,000 candidates without hiding scores.
5. Open manifests/configs side by side and the distractor example.
6. Challenge: `The smaller pool was an intentional sanity check`; preview and confirm the qualified interpretation.
7. Stage a matched reevaluation, change one operational constraint, validate, and approve the exact version.
8. Reload the investigation/history view to prove the decision remains understandable.

After the deployed hero test passes, capture the public URL and screenshots of live WebMCP scope, evidence, and immutable approval history.

## Build Checklist Handoff

`build-checklist` should build vertical slices:

1. Repository/contracts/auth skeleton and two local apps.
2. Public demo fixture in the control room.
3. Candidate-pool audit and evidence drawer.
4. WebMCP adapter: two core tools, then all five.
5. Prepared import preview and confirmed persistence.
6. Investigation, challenge, plan versioning, and approval.
7. Resume, hero Playwright test, deployment smoke test, and submission captures.

Each slice needs a visible checkpoint and automated verification. P1 starts only after deployed P0 passes end to end.
