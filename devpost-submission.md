# Title

Research Audit Workbench

## One-line Summary

A WebMCP workspace that helps ML researchers test whether experiment results are comparable, inspect the source evidence, and approve an exact next step without giving the agent durable authority.

## Problem

An ML experiment can report a higher score for the wrong reason. A changed evaluation split, candidate pool, preprocessing step, or metric definition can make two valid results unsuitable for direct comparison. The problem is especially costly for early-career researchers, who may spend more compute or change a research direction based on an apparent improvement that the evidence does not support.

Experiment trackers preserve runs, but the researcher still has to reconstruct whether the comparison was fair, what evidence supports that conclusion, and what to do next. A browser agent can help with that work, but its explanation should not become the evidence or silently change the research record.

## Solution

Research Audit Workbench puts the current experiment pair, decision question, audit findings, and source records on one page. Through WebMCP, a browser agent can read the live selection, start a deterministic comparability audit, focus the cited evidence, and stage a challenge or reevaluation plan.

The prepared demo starts with Run A at 84% Recall@5 and Run B at 76%. The audit finds that Run A used 200 candidates per query while Run B used 1,000. It preserves both scores and concludes only that the direct ranking is not established under matched conditions. The researcher can inspect both manifests, add the context that Run A was an intentional sanity check, and approve a matched reevaluation plan bound to one exact digest.

Every durable transition is separate from WebMCP. The researcher saves the first finding, confirms the revised interpretation, saves a plan, and approves its exact version. The agent cannot approve, delete, or execute anything.

## Why This Matters

The app is designed for a common research decision: whether an apparent gain justifies another use of time or compute. It changes the collaboration from "trust the agent's explanation" to "inspect the evidence, challenge the interpretation, and authorize the next action."

That authority boundary makes WebMCP useful here. The agent can work with the page's current state and help move the investigation forward, while the application remains responsible for facts, validation, ownership checks, and the permanent record.

## How We Used AI

The runtime collaboration happens through an external browser agent using WebMCP. The page registers five tools:

- `get_current_comparison`
- `run_comparability_audit`
- `show_finding_evidence`
- `stage_challenge_revision`
- `stage_resolution_plan`

The agent uses those tools to inspect the live pair and prepare reversible work. It does not generate the factual audit. Pure Python rules compare the normalized run snapshots, prefer recorded manifests over declared configuration, produce bounded citations, and avoid attributing any share of the eight-point score gap to the mismatch.

The app does not require a runtime model API. This keeps the browser agent replaceable and makes the evidence path testable even when WebMCP is unavailable. In an unsupported browser, the same workflow remains available through manual controls.

## How We Used Codex

Codex helped turn the initial "researcher with JARVIS" idea into a focused product scope, PRD, technical specification, and sequenced build checklist. It then implemented and verified the vertical slices across Next.js, FastAPI, Supabase, WebMCP, generated contracts, and Vercel deployment.

During implementation, Codex used test failures and live browser checks to fix WebMCP registration timing, hydration races, authentication boundaries, ZIP parser protections, CORS, public environment configuration, and exact approval persistence. Folder-level `AGENTS.md` and `CLAUDE.md` files keep Codex and Claude Code on the same authority rules: deterministic code owns facts, the API is stateless, Next.js owns durable writes, and WebMCP may stage but never approve.

The final verification included 22 Pytest tests, Ruff, TypeScript, ESLint, 9 Vitest tests, a production build, 26 pgTAP assertions, generated contract drift checks, and five public Playwright journeys. The deployed browser suite covered signup, prepared import, audit, evidence, challenge, exact approval, reload, resume, the disposable demo, mobile layout, and keyboard focus.

## Key Features

- Five live, selection-scoped WebMCP tools behind one feature-detected adapter
- Deterministic candidate-pool audit with cautious language and recorded evidence priority
- Side-by-side manifests with JSON locations, values, and source hashes
- Researcher challenge flow that can revise an interpretation without erasing the limitation
- Versioned plan validation and approval bound to a server-computed SHA-256 digest
- Public disposable demo with no authentication or durable writes
- Private prepared-package import, row-level ownership, investigation history, and resume
- Manual browser path when WebMCP support is unavailable

## Architecture

The repository contains two deployed applications. The Next.js app renders the workbench, registers WebMCP tools, manages Supabase SSR authentication, and owns human-confirmed Route Handlers. The stateless FastAPI service parses bounded prepared packages, runs deterministic audits, and validates plans. It has no database credentials.

Supabase provides authentication, PostgreSQL, storage boundaries, row-level security, append-only investigation events, and immutable approved plans. FastAPI's OpenAPI document generates the checked-in TypeScript contracts. The public demo uses a separate in-memory fixture so none of its actions create private rows.

WebMCP touches only one adapter. Registrations are scoped to the current selection and aborted when the route or pair changes. Tool inputs and versioned outputs are runtime-validated. No registered tool can perform a durable write.

## Testing Instructions

No credentials are needed for the judged walkthrough.

1. Open `https://webmcp-research-auditor.vercel.app/demo` in ChatGPT's in-app browser or Chrome with WebMCP enabled.
2. Ask the browser agent to inspect the current comparison. It should report Run A, Run B, the decision question, and recorded evidence availability.
3. Ask it to run the comparability audit. The page should report that model improvement is not established because the candidate pools are 200 and 1,000.
4. Ask it to show the finding evidence. Verify the side-by-side manifest values, JSON locations, and hashes.
5. Click `Save finding and create investigation`. Ask the agent to stage a challenge using: `The smaller pool was an intentional sanity check.`
6. Confirm the revision. Ask the agent to stage a matched reevaluation plan.
7. Change the batch size to 16. The plan should remain matched and receive a new exact digest.
8. Click `Approve exact plan`. Verify the immutable approval card includes plan v1, its digest, the researcher actor, and `no execution permission granted`.

In standard Chrome, the WebMCP badge reports `manual fallback`; use the same buttons to complete the full flow. To test persistence, choose `Open private workspace`, create an account, import the prepared package, and complete the authenticated investigation. Email confirmation is disabled for the hackathon deployment.

## Public Demo Link

https://webmcp-research-auditor.vercel.app/demo

## Public Repository Link

https://github.com/LunaDream74/research_audit_workbench

`[BLOCKED BEFORE SUBMISSION: the public repository exists but is currently empty. Push the current main branch so it contains the complete source, setup instructions, prepared fixture, migrations, tests, and MIT license.]`

## Demo Video

https://youtu.be/bwVSzirSxCA

The public video is titled `Research Audit Workbench`. A matching timed 1:44 script is available in `docs/demo-video-script.md`.

## Screenshot Shot List

1. Live selection and agent scope: `docs/submission-assets/01-live-webmcp-scope.png`
2. Deterministic comparability finding: `docs/submission-assets/02-comparability-finding.png`
3. Inspectable side-by-side source evidence: `docs/submission-assets/03-side-by-side-evidence.png`
4. Human challenge with the factual limitation retained: `docs/submission-assets/04-challenge-revision.png`
5. Immutable exact-plan approval record: `docs/submission-assets/05-immutable-approval-history.png`

## Submission Readiness Notes

- [x] Public demo is deployed and passed the complete public browser suite.
- [x] API authentication, explicit CORS, and exact production origins were smoke-tested.
- [x] Five submission screenshots were captured from the deployed app and reviewed.
- [x] Setup, architecture, testing, known limits, AI usage, and Codex usage are documented.
- [x] MIT license is present at the repository root.
- [x] Confirm the final title and one-line summary.
- [ ] Push the current main branch to the empty public repository and verify the README and MIT license render.
- [x] Generate a narrated 1:44 MP4 from the deployed WebMCP-enabled walkthrough.
- [x] Publish the narrated video on YouTube and verify its public metadata.
- [x] Confirm the submitter type and country of residence for the official form.

## Known Limitations

- Candidate-pool mismatch is the deepest implemented audit rule. Broader evaluation-split, preprocessing, and metric-definition coverage is future work.
- Full-fidelity import supports the documented prepared retrieval ZIP rather than arbitrary experiment folders.
- The product validates and approves a next-run plan but does not execute experiments.
- WebMCP is experimental. The adapter feature-detects support, aborts stale registrations, and preserves a manual workflow.
- The public demo is deliberately in memory. Persistent investigations require a free account.

## TODO Official Form Fields

- Submitter Type: `Individual`
- Country of residence: `Vietnam`
- Organization name: `Not applicable unless submitting for an organization`
- App Status: `New`
- Existing-app update explanation: `Not applicable`
- Live URL: `https://webmcp-research-auditor.vercel.app/demo`
- Testing instructions: use the eight-step walkthrough above; no credentials required
- Public code repository: `https://github.com/LunaDream74/research_audit_workbench` (repository is public but must be populated before submission)
- Agent/client testing: `Chrome 151 with experimental web platform features for native five-tool invocation; standard Chrome for manual fallback; mocked document.modelContext for adapter unit tests`
- AI tools used during development: `Codex and Claude Code`
- Learning derived: `Significant`
- Career-reusable AI value: `Yes`
- Codex session ID: `Not requested by the official WebMCP submission form`
