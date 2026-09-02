# Build Checklist

## Build Preferences

- **Planning ownership:** Handed off to Codex.
- **Build mode:** Autonomous (locks when `$build-project` begins).
- **Comprehension checks:** N/A.
- **Git:** Initialize the project repository in item 1; commit after each green vertical slice so every completed item is a revert point.
- **Verification:** Automated checks after every item, plus participant inspection pauses after items 4, 7, and 10.
- **Check-in cadence:** Speed-run between inspection pauses; stop immediately for a blocker, a scope-changing choice, or a failed acceptance check that requires a product decision.
- **Scope gate:** P0 only until the deployed hero path passes. Do not begin P1 or P2 opportunistically.
- **Wow moment:** The external agent exposes the 200-vs-1,000 candidate-pool mismatch, the researcher challenges the interpretation, and the researcher approves an exact defensible reevaluation plan.

## Checklist

- [x] **1. Scaffold the two-app monorepo and agent context**
  Spec ref: `spec.md > File Structure`
  What to build: Initialize git, npm workspaces, `apps/web`, `apps/api`, `packages/contracts`, `supabase`, and the demo fixture directory. Add root and folder-local `AGENTS.md`/`CLAUDE.md`, shared scripts, environment examples, formatting, and minimal Next.js/FastAPI health pages.
  Acceptance: Both apps start locally; no secret is committed; folder context makes Next.js the durable-write owner and FastAPI stateless; the first clean commit exists.
  Verify: Run web typecheck/lint, `uv run pytest`, both health endpoints, `git status --short`, then commit the green scaffold.

- [x] **2. Define shared contracts and the retrieval demo fixture**
  Spec ref: `spec.md > HTTP API Contracts`
  What to build: Implement Pydantic request/response schemas for import preview, comparability audit, evidence references, resolution plans, and validation. Export OpenAPI and generate TypeScript types. Create the documented Run A/Run B package and expected parsed snapshot.
  Acceptance: The fixture contains 84%/200 candidates and 76%/1,000 candidates with configs, manifests, hashes, and a distractor example; generated TypeScript matches OpenAPI with no manual duplication.
  Verify: Run schema/fixture Pytest tests and the contract-generation diff check; commit only when regeneration is clean.

- [x] **3. Build the deterministic candidate-pool audit**
  Spec ref: `spec.md > Architecture > Deterministic Audit Engine`
  What to build: Add the pure Python audit rule, evidence-priority logic, configuration/manifest inconsistency handling, cautious finding text, and `POST /v1/audits/comparability`.
  Acceptance: Both scores remain visible; the 200-vs-1,000 mismatch qualifies direct ranking; recorded evidence outranks declarations; disagreement creates a separate finding; no causal share of the eight-point gap is invented.
  Verify: Run Pytest golden, missing-manifest, conflicting-source, equal-pool, auth, and no-causal-overclaim cases.

- [x] **4. Render the disposable control-room demo**
  Spec ref: `spec.md > Architecture > Demo Fixture and Walkthrough`
  What to build: Create dark technical `/demo` UI with permanent demo labeling, the two run cards/table, exact-two selection, decision question, progress area, finding card, and responsive layout backed only by fixture/in-memory state.
  Acceptance: A judge can identify the apparent winner, selected pair, question, and agent scope without explanation; no demo action creates Supabase data; the highest score is not labeled `best`.
  Verify: Run Vitest UI checks and a Playwright disposable-state test, then pause for participant inspection of the first visual checkpoint.

- [x] **5. Prove the WebMCP adapter with live selection and audit tools**
  Spec ref: `spec.md > WebMCP Tool Contracts`
  What to build: Implement the feature-detected adapter, schema validation, versioned tool results, abort-based unregister behavior, `get_current_comparison`, and `run_comparability_audit`; connect audit progress/results to the page.
  Acceptance: A supported browser agent reads the current pair and starts the deterministic audit; changing the pair invalidates old registration/results; unsupported browsers retain the manual demo path; tools cannot write durable state.
  Verify: Run mocked `modelContext` Vitest tests and manually invoke both tools in the target WebMCP browser before proceeding.

- [x] **6. Add inspectable evidence and complete the five-tool surface**
  Spec ref: `spec.md > Components And Responsibilities > Finding and Evidence Presentation`
  What to build: Add the side-by-side evidence drawer with source level, path, hash, surrounding context, and highlighted values. Register `show_finding_evidence`, `stage_challenge_revision`, and `stage_resolution_plan` as reversible UI previews.
  Acceptance: The judge can verify 200 and 1,000 from their source records; agent prose is visually separate from facts; missing evidence is explicit; none of the five tools exposes a durable-write or approval action.
  Verify: Run evidence/tool unit tests, inspect the registered tool list, and manually trace every displayed claim to fixture evidence.

- [x] **7. Complete the in-memory challenge-to-approval wow loop**
  Spec ref: `spec.md > Data Flow > Audit-to-Approval Lifecycle`
  What to build: Implement challenge preview/diff, retained-limitation display, editable versioned plan, deterministic plan validation, specific limitation acknowledgment, exact digest display, and demo approval history in memory.
  Acceptance: `intentional sanity check` revises interpretation without erasing incompatibility; a batch-size edit stays valid; a one-sided candidate-pool edit warns; approval binds only the exact version and cannot imply autonomous execution.
  Verify: Run domain/Vitest tests and the Playwright wow-path through exact approval, then pause for participant inspection of the central demo moment.

- [x] **8. Add Supabase auth, schema, RLS, and storage boundaries**
  Spec ref: `spec.md > Architecture > Supabase Auth, Database, and Storage`
  What to build: Add email/password SSR auth, migrations for the nine compact tables, constraints/indexes, RLS policies, small-artifact storage policies, and local seed data. Keep service credentials server-only.
  Acceptance: Private routes require auth; users cannot read or mutate another owner's rows/artifacts; investigations require two distinct owned runs; approved plans cannot be edited in place; demo remains independent.
  Verify: Run migration/seed checks, RLS cross-user tests, plan-immutability tests, and authenticated/unauthenticated route tests.

- [x] **9. Implement safe prepared-package preview and human confirmation**
  Spec ref: `spec.md > Data Flow > Prepared Import Lifecycle`
  What to build: Add bounded ZIP parsing and `POST /v1/imports/preview`, then the import-review screen and human-only `POST /api/imports/confirm` transaction for valid records and allowed artifacts.
  Acceptance: The 10 MB cap, traversal/symlink/nested-archive/expansion/binary protections work; every file and warning is reviewable; nothing persists before confirmation; confirmed records survive sign-out/sign-in.
  Verify: Run parser security/golden tests, confirmation ownership/digest tests, and a Playwright prepared-import journey.

- [x] **10. Persist investigations, challenges, plans, approvals, and resume**
  Spec ref: `spec.md > Architecture > Investigation and Approval Domain`
  What to build: Implement human-only Route Handlers for first-finding creation, challenge confirmation, draft plans, server-revalidated approval, append-only events, and the investigation-list/detail resume flow.
  Acceptance: Temporary audits create no durable finding; stale/cross-owner digests fail; approval stores exact version, digest, actor, time, rationale, and limitation; editing approved content creates `n+1`; reload restores the understandable decision without restarting agent work.
  Verify: Run handler/domain/database tests and Playwright save-reload-approve history checks, then pause for participant inspection of the persistent MVP.

- [x] **11. Harden, deploy, and prove the P0 hero path**
  Spec ref: `spec.md > Risks And Verification`
  What to build: Close accessibility/responsive/error-state gaps, configure explicit CORS and preview/production environment variables, deploy separate web/API Vercel projects, and run the complete hero test and smoke checks against the public origins.
  Acceptance: The deployed URL completes selection -> WebMCP audit -> evidence -> challenge -> validated exact approval; import and resume work when authenticated; demo creates no durable rows; all P0 checks pass and P1 remains untouched.
  Verify: Run full lint/typecheck/Pytest/Vitest/Playwright suites, OpenAPI diff check, deployed health/preview/audit/validation smoke tests, and a three-minute timed rehearsal.

- [x] **12. Prepare Devpost handoff**
  Spec ref: `prd.md > Submission Proof Points`
  What to build: Gather the public URL, repository link, exact setup/demo instructions, testing notes, AI/Codex/Claude usage, architecture summary, and screenshots of live WebMCP scope, side-by-side evidence, challenge revision, and immutable approval history.
  Acceptance: The materials prove WebMCP leverage, inspectable trust, human authority, reliability, and the unsupported-decision-to-defensible-action story; enough material exists to run `$prepare-submission` without reconstructing the build.
  Verify: Review every link and screenshot against the deployed app, rerun the three-minute story, and confirm the next command is `$prepare-submission`.
