# Demo video script

Target length: 1 minute 44 seconds. Record in a WebMCP-enabled browser at 1440 by 900 or larger and use the prepared `/demo` route.

## 0:00 to 0:17: the decision problem

"An ML run reports 84 percent Recall at 5, while the baseline reports 76 percent. That looks like a clear improvement, but a score alone does not tell us whether the comparison was fair. Research Audit Workbench lets a researcher and a browser agent check the evidence before committing more compute."

Show the selected Run A and Run B cards, the decision question, and the live WebMCP badge.

## 0:17 to 0:39: WebMCP reads live scope and audits

Ask the browser agent to inspect the current comparison and run a comparability audit. Show that the page exposes the selected pair and question through WebMCP, then let the audit render.

"The agent is working with the current page state, not a copied prompt. The audit itself is deterministic. It finds that Run A used 200 candidates per query while Run B used 1,000. Both recorded scores remain valid, but they do not establish a direct model ranking."

## 0:39 to 0:54: inspect the source evidence

Ask the agent to show the finding evidence. Open the side-by-side evidence panel.

"Each claim points back to a recorded manifest, a JSON location, and a source hash. The retrieval example explains why the larger pool may be harder, but the interface clearly says it does not quantify how much of the score gap came from that difference."

## 0:54 to 1:13: the human challenges the interpretation

Save the finding, enter "The smaller pool was an intentional sanity check," and ask the agent to stage a revision.

"The researcher adds context. The result is now described as a valid sanity check, but it is still unsuitable for direct baseline comparison. The factual limitation survives the revision, and only the researcher can confirm it."

## 1:13 to 1:44: approve an exact next action and close

Confirm the challenge, ask the agent to stage a matched reevaluation plan, change the batch size to 16, and approve the exact plan.

"The agent proposes a matched reevaluation. Deterministic validation checks the plan, and the researcher approves one exact version. The record includes the plan digest, actor, rationale, and limitation. WebMCP has no approval or execution tool."

Close on the immutable approval record: "This turns an unsupported decision into a defensible next action. The public demo is disposable, while signed-in researchers can import records and resume the full history later."
