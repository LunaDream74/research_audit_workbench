# Web App Agent Contract

- Own UI, Supabase SSR auth, repositories, and all durable Route Handler writes.
- Keep `/demo` isolated from Supabase and backed only by versioned fixtures plus in-memory state.
- Keep direct `document.modelContext` access inside `src/webmcp/adapter.ts`.
- Never label a numerically higher score as the best model before comparability is established.
- Use human-only controls for confirmation and approval.
- Keep the seven-tool active registry reversible; history registers only comparison, readiness, and decision-brief reads.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
