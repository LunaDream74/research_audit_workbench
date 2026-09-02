# Build Notes

## 2026-08-31 — Guided build onboarding started

- Anh Minh explicitly chose the optional guided path.
- Working direction: a human-agent ML experiment investigation and decision workbench.
- Product name remains intentionally unset; the participant will choose it.
- Known strengths imported from the portfolio: applied ML, EEG and multimodal research, quantitative evaluation, Python, PyTorch, and FastAPI.
- Details awaiting confirmation: precise MVP workflow, frontend experience, preferred stack, other AI coding tools, and desired pace.
- Deepening rounds completed: 0.
- Active shaping: the participant selected the guided path after reviewing the direct-build alternative.

## 2026-08-31 — Onboarding round 1 confirmed

- Anh Minh confirmed the core concept should remain: a shared human-agent workflow for investigating ML experiments and deciding the next run.
- Confirmed web stack: JavaScript, TypeScript, React, Next.js, PostgreSQL, Supabase or Neon, and Vercel.
- Confirmed coding agents: Codex and Claude Code, including multi-agent orchestration.
- Preferred orchestration style: folder structures that direct each coding agent to the correct files, responsibilities, and context.
- Active shaping: explicitly kept the proposed core workflow and supplied the implementation stack and context-management approach.

## 2026-08-31 — Onboarding round 2 sharpened

- Primary user: solo, early-career ML researchers, particularly third- and fourth-year undergraduates and graduates.
- Starting state: researchers import their own experiment records; records persist across logins and can be changed or deleted by their owner.
- Hero scenario: Run A appears substantially better, but the agent detects that its evaluation split, candidate pool, preprocessing, or other metadata differs from the comparison run, making the improvement unfair or inconclusive.
- Agent authority: agents can analyze records and suggest findings for human verification; they can also propose experiments and experiment plans, but the human must confirm before findings or plans are durably written.
- Active shaping: Anh Minh replaced a generic run-comparison workflow with a specific fairness-audit wedge and established explicit human approval boundaries.

## 2026-08-31 — Onboarding round 3 completed

- Experience metaphor: a lab control room in which the researcher is the decision-making center and agents operate under their direction.
- Interface progression: guide new researchers first, then let them transition into denser tables, charts, and visual explanations.
- Agent voice: neutral auditor, including direct criticism when the evidence warrants it.
- Visual direction: dark technical by default, with a warm-aesthetic toggle.
- Deepening rounds completed: 0; onboarding's optional inspiration round was completed.
- Active shaping: Anh Minh made human control visible in the product metaphor and chose progressive information density instead of forcing a single novice or expert interface.

## 2026-09-01 — Scope brain dump captured

- Full source: `docs/hackathon-build/idea-unfiltered-version.md`.
- Existing research mess is the starting point: a folder containing metrics, configurations, checkpoints or references, retrieval examples, notes, and possibly paper-derived results. The import should propose groupings, surface ambiguity, and preserve unresolved or missing information.
- Core distinction: possessing results is not equivalent to having enough evidence for a fair comparison. Normalized metric labels must remain inspectable and must not imply identical metric implementations.
- Core decision question: “Is this apparent improvement strong enough to justify the next use of research time or compute?”
- Hero finding: Run A records 84% versus Run B's 76%, but A used 200 candidates per query while B used 1,000. The scores remain valid individually, while the direct model-improvement conclusion is qualified.
- Evidence hierarchy: actual recorded evaluation inputs are stronger than declared configuration; disagreement between the two becomes its own unresolved finding.
- Human verification: every claim links to the relevant source fields or artifacts. The researcher may add context such as “intentional sanity check,” which changes the interpretation without erasing the comparability warning.
- Proposed follow-up: a controlled reevaluation preview states the question, fixed variables, changed variables, available and missing artifacts, operational constraints, and decision threshold. Approval applies only to that exact version.
- MVP value does not depend on remote execution: an approved plan may be exported with runnable instructions. Connected execution can remain optional.
- Durable investigation history should connect the original claim, evidence, researcher challenge, approved follow-up, and eventual resolution.
- Demo thesis: the audience witnesses an unsupported decision become a defensible one; the workspace carries the evidence rather than asking viewers to trust an eloquent agent.
- Personal motivation: reduce confusion about run contents and missing information, gain a brainstorming partner, and retain final decision authority—the “researcher with JARVIS” feeling.
- Imported record candidates: metrics, configs, dataset and split identifiers, preprocessing, artifacts, notes, and referenced results from other papers.
- Active shaping: Anh Minh explicitly rejected hiding valid scores, overstating causal explanations, requiring execution infrastructure, or presenting agent conclusions without inspectable evidence.

## 2026-09-01 — Scope references and differentiation

- Borrow from Weights & Biases: fast sortable run selection, pinned metrics, side-by-side configurations, artifact previews, and a dense control-room feeling.
- Do not reproduce W&B's dashboard flexibility or become another general-purpose experiment tracker; the comparison screen exists to decide whether results are comparable and what follows.
- Borrow from MLflow: the experiment → run → parameters → metrics → artifacts hierarchy and immutable source provenance, retaining filenames, hashes, timestamps, and relationships.
- Avoid an archival experience where users must reconstruct why accumulated runs matter.
- Product-model decision: the investigation—not the run—is the central durable object. It joins selected evidence, comparability issues, researcher challenges, decisions, and resolutions.
- Borrow from Evidently: explicit findings with severity, status, evidence, confidence, and test results.
- Avoid static reports and simplistic pass/fail outcomes. Findings may be detected, acknowledged, disputed, resolved, or accepted as limitations; human context is preserved without deleting the underlying caveat.
- Distinct interaction chain: run control room → comparability audit → human challenge → proposed resolution → approval record.
- Active shaping: Anh Minh narrowed the product away from dashboarding and archival tracking toward decision-centered investigations.

## 2026-09-01 — Scope constraints confirmed

- Available build budget: 36 focused hours before submission.
- Demo data: a carefully prepared retrieval experiment dataset is acceptable for the full audit experience.
- Generic import promise: CSV, JSON, and/or folders may be accepted with more limited auditing rather than pretending every research format is fully understood.
- MVP stopping point: an approved, versioned experiment plan is sufficient; exporting runnable configuration, queuing jobs, and executing experiments are not required.
- Scope implication: spend the available time on one credible import-to-investigation-to-approval loop and its WebMCP interactions rather than execution infrastructure.

## 2026-09-01 — Scope gaps resolved and cuts accepted

- Full-fidelity import contract: one documented retrieval-experiment ZIP/folder schema for the demo; generic CSV/JSON import is explicitly best-effort.
- Audit depth: implement candidate-pool mismatch deeply with inspectable manifest evidence; add lighter checks for evaluation split, preprocessing, and metric-definition mismatches.
- Proposed WebMCP surface accepted: inspect selected runs, start an audit, retrieve cited evidence, record a researcher challenge, draft a resolution plan, and submit an exact plan for human approval.
- MVP finding lifecycle: `detected → challenged/acknowledged → accepted limitation or resolved`.
- Explicitly cut from the 36-hour MVP: arbitrary experiment-folder understanding, experiment-tracker integrations, flexible dashboard construction, remote job execution, runnable-script export, exhaustive audit rules, full finding-state workflow, and multi-user collaboration.
- Persistence and user ownership remain in scope; the product is for one researcher operating their own workspace, not a shared team environment.
- Active shaping: Anh Minh accepted all four narrowing recommendations in order to protect one deep, evidence-backed WebMCP interaction loop.

## 2026-09-01 — Scope document written

- Created `docs/hackathon-build/scope.md` from the completed mandatory scope interview.
- Scope deepening rounds completed: 0; Anh Minh chose to write the document after the mandatory beats.
- The project name remains intentionally unset for participant selection.
- Protected priority: prepared retrieval import → candidate-pool audit → inspectable evidence → researcher challenge → versioned plan approval.
- Secondary UI polish, including the warm theme, is explicitly conditional on the core demo path being stable.

## 2026-09-01 — PRD interview started

- The PRD will specify observable user behavior and acceptance criteria without revisiting technical implementation choices.
- First focus: first-run experience, import review, and the transition from guided onboarding to the run control room.

## 2026-09-01 — PRD import behavior confirmed

- First login: one primary “Import experiment” action plus an example walkthrough showing how the product works.
- Import review must show detected runs, associated artifacts, missing fields, ambiguous relationships, provenance, and audit readiness before confirmation.
- Partial success is required: valid records can be imported even when another run is incomplete or a file is not understood; unresolved warnings remain visible.
- After import, the researcher lands in a guided run-selection view and can explicitly transition to the denser control-room table.
- User story framing: “As a new ML researcher, I want the workspace to explain what it recognized and what remains uncertain so that I can begin an investigation without mistaking incomplete imports for complete evidence.”

## 2026-09-01 — PRD audit behavior and scope pressure

- Zero-run state: show first-time guidance and require import before investigation actions are available.
- One-run possibility raised: inspect the run or broader project and offer suggestions even without a comparison run.
- Additional import idea raised: accept a ZIP-like project package or GitHub link.
- Audit persistence: analysis remains temporary until the researcher confirms the first finding; merely running an agent audit does not create a durable investigation conclusion.
- Finding evidence view: place both source records side by side and highlight the differing fields.
- Incomplete evidence: keep the finding actionable with a warning and lower confidence rather than refusing all analysis.
- Researcher idea: fill missing evidence using a corresponding value from another run as a proposed default.
- Product integrity constraint: any copied/defaulted value must be labeled as an assumption, must not overwrite immutable source provenance, and must require researcher confirmation.
- Scope pressure to resolve: GitHub import, open-ended single-run brainstorming, multi-run selection behavior, and default-value inference may exceed the protected comparison MVP.

## 2026-09-01 — PRD audit boundaries accepted

- A workspace may contain many runs, but each comparability investigation contains exactly two; selecting more requires choosing a pair.
- A single run receives a limited completeness/readiness review and an invitation to import another run. Open-ended project brainstorming is deferred.
- The MVP ships ZIP/package import; GitHub-link import is deferred.
- A missing value may be copied from the other run only into a draft reevaluation plan, visibly labeled as an assumption and requiring confirmation.
- Copied defaults never alter imported source records and never raise the confidence of an evidence finding.
- Active shaping: Anh Minh accepted all four boundaries rather than replacing the protected comparison-and-approval loop.

## 2026-09-01 — PRD human-control behavior confirmed

- Temporary audit results use the primary action “Save finding and create investigation”; dismissal creates no durable investigation record.
- Researcher challenges cause the agent to preview a revised interpretation; a second explicit confirmation is required before saving both the challenge and revision.
- A plan edit that reintroduces an unfair comparison does not remove researcher authority: approval remains possible, but only with a prominent warning.
- Approved plan versions are immutable. Editing after approval creates a new draft version while preserving the approved version and timestamp.
- User story framing: “As a researcher, I want agent conclusions and plans to remain reviewable proposals so that I—not the agent—control the durable research record.”

## 2026-09-01 — PRD data-integrity edge cases resolved

- Duplicate artifacts: detect exact hash matches and select “Reuse existing artifact” by default, deduplicating stored content without discarding the attempted import or its provenance.
- A new import can attach existing content to another run. “Import as a separate record” may preserve a distinct name, source, and import event while referencing the same stored blob.
- Run deletion never cascades automatically to an investigation. Offer archive (recommended), remove the live run while retaining investigation snapshots, or permanent deletion with evidence redaction and explicit impact confirmation.
- Even after permanent source deletion, preserve the investigation shell, conclusions, approvals, timestamps, and deletion event unless the investigation itself is separately deleted.
- Reference states: live reference, immutable evidence snapshot, and unavailable source whose former role remains visible.
- Changed run selections mark a temporary audit stale and disable approval or promotion as current evidence, but the researcher may save it as a stale draft, restore the old selection, rerun, or discard.
- Rerunning creates a new analysis revision rather than overwriting the previous analysis.
- Extra approval acknowledgment is required only for unresolved, decision-relevant limitations—not every warning.
- The acknowledgment must name the specific consequence and use a distinct action such as “Approve with limitation”; the researcher may attach a rationale.
- The durable approval record shows the accepted warning, researcher rationale, actor, timestamp, and exact plan version.
- Active shaping: Anh Minh rejected cascading deletion, silent deduplication, forced loss of stale analysis, and generic warning checkboxes in favor of explicit provenance and researcher control.

## 2026-09-01 — PRD first-run, failure, and return behavior

- First-run walkthrough: a short, skippable, replayable, disposable preview demonstrates the complete Run A/Run B decision loop in a clearly labeled demo environment.
- Demo data enters no personal workspace, history, or storage unless the researcher explicitly chooses “Copy this example into my workspace.” The walkthrough ends by leading into personal import.
- Zero-valid-run import: preserve an import attempt with files received, recognized types, validation errors, failure reasons, expected package structure, and suggested corrections; create no experiment or run records.
- Failed attempts live in an import activity log and support retry after file replacement or remapping. Offer an example manifest/package skeleton.
- Interrupted audit: preserve selected runs, research question, completed progress, failure point, safe diagnostics, and retry action while saving no partial conclusion as a finding.
- The investigation remains an interrupted draft; partial conclusions are visibly provisional. Returning to it never restarts agent activity automatically.
- Returning-home decision: signed-in researchers land on the investigation list rather than a generic run dashboard.
- Requested visible investigation states: unresolved, interrupted, stale, proposal ready, approved, approved with limitation, resolved, and archived.
- Reopening restores the selected runs, question, evidence panels, conversation, proposal edits, and working context; execution and durable promotion always require explicit action.
- Reliability promise: nothing is fabricated when evidence is missing, nothing incomplete becomes a conclusion, nothing resumes without the researcher, and nothing enters the durable record invisibly.

## 2026-09-01 — PRD time-budget cuts accepted

- Audit retry preserves the interrupted attempt but starts a new audit revision rather than resuming an internal execution step.
- Returning users regain logical working context, not exact scroll position or transient interface details.
- `resolved` exists in the investigation model, but follow-up-result ingestion is outside the hackathon MVP; the shipped workflow ends at plan approval.
- Active shaping: Anh Minh accepted all three implementation-risk cuts while retaining the product's reliability contract.

## 2026-09-01 — PRD document written

- Created `docs/hackathon-build/prd.md` with eight user-facing epics, testable acceptance criteria, investigation and finding states, edge cases, MVP boundaries, and submission proof points.
- PRD deepening rounds completed: 0; Anh Minh chose to write after the mandatory interview.
- The PRD preserves the reliability contract: no fabricated evidence, incomplete conclusion promotion, invisible durable write, or automatic agent resumption.
- Protected wow moment: an external agent discovers the candidate-pool mismatch from the researcher's current selection, the researcher verifies and challenges it, and an exact resolution plan is approved.

## 2026-09-01 — Technical spec interview started

- Known preference: TypeScript, React, Next.js, PostgreSQL through Supabase or Neon, and Vercel deployment.
- The spec will favor a single deployable application and deterministic audit logic around the prepared retrieval dataset.
- Decisions still needed: database/auth/storage provider, AI boundary, file-upload persistence, and precise WebMCP interaction model.

## 2026-09-01 — Technical stack confirmed and current docs checked

- Confirmed stack: Next.js with TypeScript, Supabase for PostgreSQL/Auth/Storage, and Vercel deployment.
- AI boundary: the user's external browser agent performs interpretation and drafting through WebMCP; the app does not require its own model API for the MVP.
- Artifact boundary: upload metadata and small evidence artifacts only. Large checkpoints remain external references with paths and hashes.
- Deployment target: a public Vercel URL.
- Current official WebMCP draft uses `document.modelContext.registerTool(...)`, structured input schemas, asynchronous execution, and tool annotations; isolate this experimental surface behind one client adapter.
- Next.js App Router and Route Handlers fit a single-app backend-for-frontend architecture; Supabase's current Next.js guidance uses cookie-backed SSR authentication.
- Architecture principle: deterministic audit functions produce structured evidence; the external agent interprets that evidence and proposes human-reviewable text or plans.

## 2026-09-01 — Python boundary restored by participant

- Active shaping: Anh Minh rejected an all-TypeScript implementation and explicitly retained Python/FastAPI.
- Confirmed: deterministic audit outputs, WebMCP-staged previews with human-only durable confirmation, and a compact relational model with JSON snapshots.
- Current Vercel documentation supports FastAPI as a Python Function. The proposed stable deployment is two Vercel projects from one repository rather than relying on private-beta Vercel Services.
- Proposed responsibility boundary: Next.js/Supabase own authentication and durable writes; a stateless FastAPI service owns package parsing, deterministic comparability analysis, and plan validation.

## 2026-09-01 — Hybrid deployment boundary confirmed

- Confirmed: one monorepo deployed as separate Next.js and FastAPI Vercel projects.
- Confirmed: FastAPI is stateless; Next.js/Supabase exclusively own durable database and storage writes.
- Confirmed: FastAPI endpoints require a valid Supabase user token.
- Confirmed: MVP import packages are capped at 10 MB and reject checkpoint binaries while retaining checkpoint paths and hashes as references.

## 2026-09-01 — Data and WebMCP contracts confirmed

- Confirmed compact tables: `import_attempts`, `experiments`, `runs`, `artifacts`, `run_artifacts`, `investigations`, `analysis_revisions`, `plan_versions`, and `investigation_events`.
- Use validated JSON snapshots for metrics, configurations, findings, evidence, and plan bodies while retaining relational ownership and lifecycle boundaries.
- Confirmed WebMCP tools: `get_current_comparison`, `run_comparability_audit`, `show_finding_evidence`, `stage_challenge_revision`, and `stage_resolution_plan`.
- Confirmed append-only investigation event history.
- Confirmed that import, deletion, finding confirmation, challenge saving, and plan approval remain human-only interface actions.

## 2026-09-01 — Repository and data lifecycle confirmed

- Confirmed monorepo folders: `apps/web`, `apps/api`, `packages/contracts`, `supabase`, `demo/retrieval-package`, and durable planning docs.
- Confirmed folder-local `AGENTS.md` and `CLAUDE.md` files to constrain Codex and Claude responsibilities.
- Confirmed FastAPI Pydantic/OpenAPI as the HTTP contract source, with generated TypeScript client types.
- Confirmed lifecycle: authenticated browser → stateless FastAPI import preview → human-confirmed Supabase persistence → WebMCP audit → temporary result → human-created investigation → agent-staged challenge/plan → human-confirmed immutable history.

## 2026-09-01 — Technical priority contract confirmed

- P0: public disposable `/demo`; Supabase email/password auth; prepared ZIP import/review/confirmation; two-run control room; five WebMCP tools; deep candidate-pool audit; evidence verification; confirmed challenge; versioned plan validation/approval; investigation resume; two Vercel deployments; hero-path tests.
- P1 after the demo works: failed/partial import activity, duplicate reuse, interrupted/stale revisions, one-run completeness review, and lighter audit rules.
- P2 deferred: generic import breadth, advanced deletion/snapshot/redaction, copying demo data, warm theme, and complete status/archive controls.
- Confirmed tooling: npm workspaces, Python `uv`, Tailwind/shadcn, TanStack Table, Zod, generated OpenAPI types, Pytest, Vitest, and one Playwright hero test.
- Confirmed public `/demo` route and Supabase email/password authentication for private persistent workspaces.
- Active shaping: the comprehensive PRD remains the product direction, while Anh Minh accepted a smaller P0 implementation contract for the 36-hour build.

## 2026-09-01 - Technical spec written

- Created `docs/hackathon-build/spec.md` from the completed technical interview.
- Spec deepening rounds completed: 0; the participant asked to continue after all mandatory architecture decisions had already been recorded.
- Checked current official documentation for WebMCP registration, Next.js Route Handlers, Supabase cookie-backed SSR auth, and FastAPI on Vercel.
- Protected architecture: two Vercel projects; Next.js/Supabase own auth and durable writes; stateless FastAPI owns parsing, deterministic audits, and plan validation.
- Protected authority boundary: five WebMCP tools expose live context and reversible previews; import confirmation, finding creation, challenge saving, and plan approval remain human-only.
- Architecture self-review resolved three high-risk seams: WebMCP churn is adapter-isolated, demo data is separated from private persistence, and approval is bound to a server-recomputed plan digest.
- Build handoff is vertical-slice-first, with P1 blocked until the deployed P0 hero path passes end to end.

## 2026-09-01 - Checklist preferences and draft

- Planning ownership: Anh Minh handed checklist design to Codex.
- Build mode selected for the handoff path: autonomous; this locks when `$build-project` begins.
- Verification preference: automated checks after every item plus participant inspection pauses after the first visual demo, the complete wow loop, and the persistent MVP.
- Wow moment confirmed: the agent exposes the 200-vs-1,000 candidate-pool mismatch, the researcher challenges the interpretation, and approves an exact defensible reevaluation plan.
- Git cadence: initialize the project repository during scaffold, then commit each green vertical slice as a revert point.
- Drafted 12 sequenced P0 items in `docs/hackathon-build/checklist.md`; P1 is gated behind a deployed, passing hero path.
- Checklist deepening rounds completed: 0; the handoff path uses the participant's final gut-check instead.

## 2026-09-01 - Checklist locked and autonomous build started

- Anh Minh accepted the 12-item checklist with "begin" and requested no cuts or reordering.
- Autonomous mode is now locked for this build.
- Required participant inspection pauses remain after checklist items 4, 7, and 10.

## 2026-09-01 - Item 1 dependency-install blocker

- Created the requested isolated Python environment at `apps/api/.venv` before installing Python dependencies.
- Redirected uv's cache to the workspace-local `.uv-cache` because the default user cache was not writable.
- The runtime frontend dependencies completed and produced `package-lock.json` (`next`, `react`, and `react-dom`).
- The frontend development dependency install was interrupted after producing no output; TypeScript, Vitest, and Playwright are not installed yet.
- The uv sync failed after four retries because the request to PyPI for Pydantic timed out. No Python dependencies were installed into the venv.
- Checklist item 1 remains unchecked and no git repository or commit has been created.

## 2026-09-01 - Dependency retry and first verification break

- Retry succeeded: frontend dependencies are locked with zero reported vulnerabilities, and Python dependencies are installed in `apps/api/.venv` with `uv.lock`.
- Python verification: 8 Pytest tests passed; Ruff initially found three mechanical import-order issues in the OpenAPI exporter and then passed after its automatic fix.
- Contract generation and TypeScript typechecking passed; the Next.js production build also passed and generated `/`, `/demo`, and `/api/health`.
- Frontend verification stopped because ESLint 10 is incompatible with `eslint-plugin-react` from the current Next.js config, Vitest could not resolve workspace-local jsdom, and Vitest collected the Playwright test directory.
- Proposed targeted correction: pin ESLint to the compatible 9.x line, run the current pure unit tests in Node rather than jsdom, and exclude `tests/e2e/**` from Vitest collection. No checklist scope change is proposed.
- Checklist items remain unchecked until the corrected frontend verification and both local health checks pass.

## 2026-09-01 - Checklist items 1-4 completed

- Applied the approved tooling correction: ESLint pinned to 9.39.5, Vitest changed to the Node environment, and Playwright tests excluded from Vitest collection.
- Item 1: created the two-app monorepo, isolated Python venv, npm/uv lockfiles, environment example, health routes, and root/folder agent context.
- Item 2: created the prepared retrieval fixture, Pydantic/OpenAPI contracts, and generated TypeScript contract output.
- Item 3: implemented the deterministic candidate-pool audit with recorded-over-declared evidence priority, inconsistency handling, cautious limitations, and a bearer-gated endpoint.
- Item 4: implemented the responsive disposable `/demo` control room with selected-pair scope, 84%/76% recorded scores, 200/1,000 candidate manifests, and an in-memory finding reveal.
- Verification passed: 8 Pytest tests, Ruff, OpenAPI generation, TypeScript, ESLint, 2 Vitest tests, Next.js production build, both local health endpoints, live audit smoke request, and 1 Playwright demo test.
- Visual inspection confirmed the dark technical page makes the decision question, pair, scores, candidate counts, agent scope, and no-persistence boundary legible at desktop width.
- The repository was initialized only after the first four items reached a green state, so these items share the first batch revert-point commit; subsequent items return to one green commit per vertical slice.
- Required participant inspection pause reached after item 4.

## 2026-09-01 - Item 5 verification pause

- Implemented the standards-facing `document.modelContext` adapter, AbortSignal lifecycle, schema-versioned tool results, live selection digest, `get_current_comparison`, and `run_comparability_audit`.
- Added mocked native registration, unsupported-browser fallback, abort, and stale-selection tests; 5 frontend unit tests pass and the production build/typecheck pass.
- Installed Chrome 151 does not expose `document.modelContext` in headless mode. Current official implementation notes confirm Chrome 150+ requires the WebMCP testing/experimental flag and that headless Chrome 149-151 may expose only a testing surface. Live invocation remains a headed-browser verification.
- Verification stopped because React lint rejects a synchronous WebMCP-status state update inside the registration effect. The proposed correction is to update status from the registration promise callback so the effect only synchronizes the external registry.
- Item 5 remains unchecked and uncommitted pending the lint correction and live flagged-browser check.

## 2026-09-01 - Checklist item 5 completed

- Moved WebMCP status updates into the asynchronous registration callback; React lint now passes.
- Native verification passed in headed Chrome 151 with `--enable-experimental-web-platform-features`.
- Chrome discovered exactly `get_current_comparison` and `run_comparability_audit`, and native `executeTool` returned the live Run A/Run B selection, question, scores, candidate counts, hashes, and selection digest.
- Chrome 151's in-page testing API expects JSON-string invocation arguments; the page tool callback still receives parsed structured arguments as specified.
- Typecheck, ESLint, 5 Vitest tests, and the Next.js production build passed.

## 2026-09-01 - Checklist items 6-7 completed

- Item 6: added side-by-side manifest evidence with source levels, paths, hashes, surrounding retrieval context, and an explicit no-causality limitation.
- Completed the five-tool WebMCP surface with `show_finding_evidence`, `stage_challenge_revision`, and `stage_resolution_plan`; all three change only visible temporary state.
- Item 7: added the human-only first-finding save, challenge preview/diff, retained factual limitation, second confirmation, editable matched reevaluation, operational-vs-decision warning classes, SHA-256 plan digest, exact approval, and immutable demo history.
- Visual self-review found that approved controls initially remained editable; corrected this by locking all plan fields and replacing the approval action with a disabled `Exact version approved` state.
- Native headed Chrome invoked all five tools in order. Challenge staging was available only after the human saved the finding; plan staging was available only after the human confirmed the revised interpretation.
- Verification passed: TypeScript, ESLint, 9 Vitest tests, Next.js production build, and the Playwright full wow-path test including post-approval immutability.
- Captured and visually reviewed `test-results/wow-checkpoint.png`; it clearly carries the full unsupported-decision-to-defensible-action story in one scroll.
- Items 6 and 7 share one commit because the evidence tools and human approval controls are one integrated vertical interaction; item 5 retains its separate native WebMCP commit.
- Required participant inspection pause reached after item 7.

## 2026-09-01 - Checklist item 8 completed

- Added cookie-backed Supabase SSR email/password authentication, anonymous workspace redirects, and a private investigation landing page while keeping `/demo` independent of Supabase.
- Added the nine-table PostgreSQL schema with ownership-preserving composite foreign keys, distinct-run investigations, version/revision uniqueness, list indexes, append-only event support, and immutable approved plan versions.
- Enabled owner-scoped RLS for every private table and a private `research-evidence` storage bucket with owner-folder, MIME, and 2 MB object limits; no service-role credential is exposed to the web client or analysis API.
- Local Supabase migration and seed application passed. Nine pgTAP checks passed against the live database, covering forged ownership, cross-user reads, distinct runs, and approved-plan update/delete rejection.
- Added a browser auth journey proving anonymous redirect and local account access. The first parallel run exposed a hydration race in the existing demo test; after participant confirmation, the audit control now waits for WebMCP initialization and both Playwright journeys pass in parallel.
- Full verification passed: TypeScript, ESLint, 9 Vitest tests, 8 Pytest tests, Ruff, Next.js production build, 2 Playwright journeys, and 9 database tests.

## 2026-09-02 - Checklist item 9 completed

- Added bounded prepared-ZIP parsing and `POST /v1/imports/preview` with compressed, expanded-size, per-file, file-count, depth, traversal, symlink, nested-archive, binary/checkpoint, duplicate-path, schema, and compression-ratio protections.
- Added the authenticated import-review UI and Next.js preview proxy. Every received file, content hash, proposed relationship, warning, run metric, candidate count, readiness result, and canonical digest is visible before persistence.
- Added the human-only confirmation route. It reparses the original package, rejects changed digests, and calls one owner-scoped PostgreSQL transaction that creates the import attempt, experiment, two runs, artifacts, and run-artifact relationships.
- Added a private workspace summary so confirmed experiment records remain visible after a fresh sign-in while RLS keeps them invisible to another account.
- Browser verification exposed two timing issues: the upload control could be selected before client hydration, and the test could navigate away before a signup server action completed. The control now stays disabled until hydration, the Next.js test origin is explicitly allowed, and the journey waits for each authenticated redirect.
- Verification passed: 17 Pytest tests, Ruff, TypeScript, ESLint, 9 Vitest tests, Next.js production build, regenerated OpenAPI/TypeScript contracts, 14 pgTAP assertions, and the Playwright prepared-import journey.

## 2026-09-02 - Checklist item 10 participant checkpoint

- Added authenticated, human-only Route Handlers for first-finding confirmation, challenge confirmation, validated draft plans, and exact approval. No durable transition is exposed through the five WebMCP tools.
- Added transactional PostgreSQL functions that bind transitions to owned runs, the current analysis revision, the active plan version, and an exact digest. Stale and cross-owner attempts fail before a write.
- Challenge confirmation creates analysis revision 2 while preserving revision 1. Plan edits after approval create `n+1`; approved versions remain immutable; investigation events are append-only for authenticated users.
- Added the private persistent workflow and investigation detail route. The detail view restores the selected evidence, both interpretation revisions, exact approved plan and digest, researcher rationale, and event history without restarting any agent work.
- Automated verification passed: 17 Pytest tests, Ruff, TypeScript, ESLint, 9 Vitest tests, Next.js production build, 26 pgTAP assertions, and all 4 Playwright journeys. The persistent journey covers import, finding save, challenge, plan edit, exact approval, reload, and resume.
- Captured `test-results/persistent-checkpoint.png` for the required participant inspection. Item 10 remains open until that inspection passes.
- Anh Minh approved the persistent-MVP visual checkpoint with “everything look good.” Item 10 is complete; item 11 is the next build slice.

## 2026-09-02 - Checklist item 11 completed

- Hardened FastAPI bearer authentication by validating access tokens against hosted Supabase Auth; missing configuration and unavailable auth fail closed. Added exact CORS origin handling and coverage for allowed and denied origins.
- Added visible keyboard focus, reduced-motion handling, narrow-screen layouts, accessible error/live states, and network-failure-safe busy controls. The deployment-aware Playwright configuration now runs the same suite against localhost or a public origin.
- Replaced signing-mode-sensitive local claim checks with authoritative Supabase `getUser()` validation at every private page and human-only Route Handler boundary.
- Deployed separate production projects at `https://webmcp-research-auditor.vercel.app` and `https://webmcp-research-auditor-api.vercel.app`, backed by a clean Singapore Supabase project with four tracked migrations and exact authentication redirect settings.
- Public verification passed: web/API health, anonymous API rejection, exact CORS allowlist, authenticated candidate-pool audit, prepared import, persistence, challenge, exact approval, reload/resume, disposable demo, mobile layout, and keyboard focus. All five public browser journeys passed in 34.4 seconds.
- Full local verification passed: 22 Pytest tests, Ruff, TypeScript, ESLint, 9 Vitest tests, production build, 26 pgTAP assertions, and generated OpenAPI/TypeScript contract drift check. P1 remained untouched until this deployed P0 gate passed.

## 2026-09-02 - Devpost handoff drafting started

- Confirmed through Devpost that submissions are open and the account is registered for The WebMCP Challenge. The deadline is September 3, 2026 at 20:00 UTC.
- Pulled the official submission fields and judging criteria. The required external assets are a working live URL, a public licensed code repository, and a public narrated YouTube demo under three minutes.
- Added a root README, MIT license, exact testing walkthrough, architecture explanation, five deployed-app screenshots, and a timed 1:44 demo-video script.
- Generated a 1:44 narrated 1440 by 900 MP4 from the deployed walkthrough. Frame review confirmed native `WebMCP · 5 tools live`, the evidence flow, and the immutable approval close; the file is ready for participant review and public YouTube upload.
- Drafted `devpost-submission.md` against the official fields, with claims tied to implemented behavior and completed verification.
- Checklist item 12 remains open until the public repository URL and public YouTube URL exist and the participant confirms the final title, submitter type, and country of residence.

## 2026-09-03 - Submission assets confirmed

- Anh Minh confirmed the title `Research Audit Workbench`, submitter type `Individual`, country of residence `Vietnam`, and completion of the production database-password rotation.
- Verified the public YouTube video at `https://youtu.be/bwVSzirSxCA`; its public metadata title is `Research Audit Workbench`.
- Verified that `https://github.com/LunaDream74/research_audit_workbench` is public. The repository is still empty, with no Git refs and a reported size of zero, so checklist item 12 and the prepare stage remain open until the current main branch is pushed.

## 2026-09-03 - Checklist item 12 completed

- Ran a committed-file secret scan before publication; no credential, token, database password, or private environment file was found.
- Published local `main` to `https://github.com/LunaDream74/research_audit_workbench` and verified the public branch, README, and MIT license through GitHub.
- The Devpost draft now contains the confirmed title, individual submitter type, Vietnam residence, public application URL, public source repository, public narrated YouTube video, exact testing walkthrough, five screenshots, architecture, AI usage, Codex usage, and known limitations.
- All checklist items are complete. The next stage is the final Devpost readiness check; no project has been sent to Devpost yet.
