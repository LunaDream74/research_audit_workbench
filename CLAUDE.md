# WebMCP Research Auditor

Read in order: `docs/hackathon-build/checklist.md`, the active item's section in `docs/hackathon-build/spec.md`, then the referenced PRD epic. Work only in the owning folder.

- Web UI and durable transitions: `apps/web/`
- Stateless parsing, audits, and plan validation: `apps/api/`
- Generated HTTP types: `packages/contracts/`
- Database/RLS: `supabase/`
- Prepared source records: `demo/retrieval-package/`

Preserve the core authority boundary: the external agent can inspect and stage; the researcher confirms every durable conclusion and approval.

The JARVIS readiness engine lives in `apps/web/src/domain/jarvis-review.ts`. Keep its scoring deterministic and its suggestions proposal-only. UI actions may focus controls or stage audits, evidence views, challenge previews, and plan previews; they must never trigger durable saves, confirmations, approvals, or execution.
