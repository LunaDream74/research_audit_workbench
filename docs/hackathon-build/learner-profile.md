# Learner Profile

## Participant

- Name: Anh Minh
- Background: Final-year AI student and researcher focused on EEG decoding, multimodal representation learning, and retrieval; experienced with measured experiments and technical writing.
- What brought them to the hackathon: Not solicited; the guided workflow begins from their stated interest in a useful human-agent WebMCP application.

## Project Idea

- Initial idea (working direction, not a final product name): A WebMCP-enabled experiment workbench for solo early-career ML researchers, especially third- and fourth-year undergraduates and graduates. Researchers import their own run records, which persist across logins and remain editable or deletable. The hero workflow audits whether apparent performance improvements are fairly comparable by checking evaluation splits, candidate pools, preprocessing, and related metadata. Agents analyze records and propose findings or next-experiment plans, but the researcher must verify and confirm them before anything is saved as a durable conclusion or plan.

## Technical Experience

- Experience level: Strong in applied ML and research experimentation, with course-project experience building and deploying a complete web application.
- Languages/frameworks known: Python, PyTorch, FastAPI, JavaScript, TypeScript, React, Next.js, PostgreSQL, Supabase, and Neon; comfortable deploying on Vercel.
- AI coding tools used before: Primarily Codex and Claude Code; comfortable orchestrating multiple coding agents.
- Prior experience planning before coding: Uses hypothesis-driven experiments and folder structures that point coding agents to the correct context and responsibility boundaries.

## Build Preferences

- Preferred pace: Fast and tightly scoped for the hackathon, with durable folder-based context before multi-agent execution.
- Likely support needs: WebMCP implementation, product scoping, interaction design, browser testing, and turning a research workflow into a polished end-to-end experience.
- Notes for downstream commands: Preserve quantified claims, inspect artifacts before trusting metrics, and make comparison validity the core value proposition. The empty state must lead into experiment-record import; imported records persist by account and support user-controlled editing and deletion. Agents may analyze and draft, but findings and experiment plans require explicit human verification or confirmation before durable writes. Keep the MVP feasible without local model training and encode agent responsibilities in the repository structure.
- Interaction model: A lab control room with the researcher at the center, reviewing and deciding on actions proposed by agents.
- Information density: Begin with a guided interface for new researchers, then provide a clear transition to denser tables, charts, and visual explanations as they need more detail.
- Agent voice: A neutral auditor that states evidence plainly and offers necessary criticism rather than defaulting to encouragement.
- Visual direction: Dark technical by default, with a user-selectable warm aesthetic.
