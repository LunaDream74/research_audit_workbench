# 1. Finished experience as I imagined
I imagine the researcher arrives with a mess that already exists: a CSV of run metrics, a few configuration files, saved checkpoints somewhere else, and folders of retrieval examples. They shouldn’t have to reorganize their research just to try the product.

They open an empty workspace and drop in an experiment folder. Maybe later there are integrations with their experiment tracker, but the first experience could simply be: **“Bring the records you already have.”**

The workspace starts identifying what it received. “I found six runs, six metric summaries, four evaluation configurations, and two folders of retrieval examples.” It shows the proposed grouping before making it permanent. One artifact has an ambiguous filename, so it asks whether it belongs to Run A or Run B. The researcher can attach it manually or leave it unresolved.

I’d want it to be comfortable saying, “This run is missing its evaluation configuration.” Missing information should remain visible throughout the experience. Otherwise the import process quietly creates a false sense that everything is understood.

Once imported, the workspace looks familiar: runs, metrics, dates, small artifact previews. The original records remain accessible. If the product maps `R@5` and `recall_at_5` into one column, the researcher can inspect that mapping; matching names alone shouldn’t establish that the calculations are equivalent.

The researcher notices the newest model scored 84%, while the baseline scored 76%. Those are our illustrative demo numbers. They select both runs.

Maybe they were about to launch a longer training job. Their actual question is less “compare these records” and more:

> “This looks promising. Is it enough of an improvement to justify another training run?”

They ask their agent while the experiment workspace is open. In the experience I’m imagining, WebMCP gives the agent access to the selected records and workspace actions. The researcher doesn’t need to export another report or explain which two runs they mean.

The page makes that scope visible: “Comparing Run A and Run B.” The agent’s activity is also visible, but in useful language—“Checking evaluation settings,” “Inspecting candidate manifests”—rather than an overwhelming stream of tool calls.

At first, it acknowledges the obvious: A has the higher recorded score. Then something changes on the page. The comparison gains a warning beside those scores:

**“Different evaluation conditions. Model improvement not established.”**

I wouldn’t hide the numbers or replace them with red error symbols. Both numbers may be perfectly valid results of their respective evaluations. The problem is the conclusion someone might draw from putting them together.

The agent explains:

> “Run A reports Recall@5 of 84%, compared with 76% for Run B. However, A was evaluated against 200 candidate images per query, while B used 1,000. Finding the correct image among fewer alternatives can be easier, so these scores don’t establish that A is the better model.”

There are two clickable references directly under that finding. Clicking one opens A’s evaluation configuration at the relevant field. Clicking the other opens B’s. If candidate manifests were imported, the product also verifies the actual counts rather than trusting configuration values alone.

That distinction matters to me. A configuration says what was intended; the recorded evaluation inputs provide stronger evidence of what happened. If they disagree, that becomes a separate unresolved finding.

The researcher asks, “Does this difference actually matter for our examples?”

Now the workspace opens one query side by side: “A pedestrian crossing a road in the rain.” It shows the stored retrieval outputs, and a second view compares which candidate images were available in each evaluation. Several visually plausible distractors were available to B but absent from A.

This is the moment the audience understands the issue without needing to know much about retrieval metrics.

But the agent stays careful. It says these examples illustrate why the evaluations differ; they don’t quantify how much of the eight-point gap the mismatch explains. It cannot invent where A would have ranked those missing images. That requires running A against the larger pool.

I can imagine the researcher pushing back:

> “We intentionally used the smaller pool for a quick sanity check.”

And the product should respond gracefully. The finding is still useful, but the language changes: “Valid sanity-check result; unsuitable for direct comparison with the baseline.” The researcher adds that explanation to the run. It becomes preserved context, so this doesn’t have to be rediscovered every time someone opens the workspace.

Then the agent asks whether they want a controlled reevaluation drafted—or, since drafting is reversible, simply puts a draft beside the finding.

The proposal starts with the question it will answer:

> “Does Run A outperform Run B when both use the same evaluation protocol?”

Below that is a concrete change preview. Keep both checkpoints fixed. Use the same evaluation queries, the same frozen 1,000-image candidate pool, the same preprocessing, and the same metric implementation. No additional training.

I’d want the proposal to show what is ready and what is missing. Maybe A’s checkpoint is accessible but B’s is only referenced by an expired path. In that case, the product can prepare the proposal, but it shouldn’t pretend it is executable. “Attach baseline checkpoint to continue” is a much better experience than a job failing mysteriously later.

The researcher edits the batch size to fit their GPU. Perhaps they also specify what would justify further training: a minimum improvement they care about, plus no unacceptable regression on their priority query slice. The agent checks whether those edits preserve the intended comparison. Changing batch size may be operational; changing only one model’s candidate pool would undermine the experiment again.

Approval feels concrete: **“Approve reevaluation of these two checkpoints with this configuration.”** It isn’t blanket permission for the agent to keep experimenting. The approved version is saved with the finding, evidence, and researcher edits attached.

If the workspace has an execution connection, approval can queue that exact job. If it doesn’t, the researcher gets an exportable evaluation configuration and runnable instructions. I wouldn’t make remote execution necessary for the first version to deliver value.

Later, the reevaluation results arrive and attach to the original investigation. I like the idea that the workspace remembers the unresolved question instead of treating the new runs as unrelated rows.

Maybe A still wins. Then the product says the gain now holds under matched conditions.

Maybe the gap disappears. Then the researcher has avoided spending more compute on an unsupported lead.

Maybe A wins slightly, but the evidence is still too uncertain to justify the planned training budget. Then “run a repeat” or “pause this direction” are legitimate outcomes.

The ambitious part is that, over time, the workspace becomes a record of **why experiments happened**: what looked promising, what evidence challenged it, what the researcher decided, and what the next result resolved. I’d want someone returning a month later to open this investigation and immediately understand, “We didn’t abandon that model. We discovered the comparison was unfair, and here’s what happened when we corrected it.”

# 2. Excites most and feels personally useful

I always tends to get lost on which runs have what, which runs is missing informations. I also finds it hard to thinks of experiments and ways to improve - having an assistant that brainstorm and having me, the human, in charge of the final decision. As I'm someone whose good at spotting mistakes and inconsistancies that might affect a run/system, having a capable assistant that can help me would be super useful and make me feels like I'm in charge - like Tony Stark with his JARVIS/FRIDAY/EDITH

# 3. Information imported experiment record

Metrics, configs, dataset/split identifiers, preprocessing, artifacts, notes and results from other papers' references.

# 4. 3-minute demo undeniable

I imagine the demo starts with the researcher already leaning toward a decision. There’s a run that looks better, and they’re about to build on it. The audience should feel that momentum before the agent interrupts it. Otherwise, discovering an unfair comparison feels like routine metadata checking rather than something that changes the research direction.

Importing the records could establish trust surprisingly quickly. The researcher brings in a folder or export, and the workspace shows what it actually understands: which metrics it found, which artifacts belong to which runs, and what’s missing. I’d love a small moment where it says, “These results are available, but I haven’t established whether they’re comparable.” It distinguishes having data from having enough evidence to make a decision.

Then the researcher selects runs and asks their own agent whether the apparent improvement is worth pursuing. The shared selection matters. They shouldn’t need to restate run identifiers, paste configurations into chat, or explain where the artifacts live. The agent starts from the same workspace the researcher is looking at.

While it investigates, I’d want the interface to show meaningful activity. The relevant evaluation settings come into view. A source artifact opens when the agent references it. The audience can follow the investigation without reading a transcript of tool calls. WebMCP becomes tangible through that coordination: the agent acts on the workspace, and the researcher can inspect and redirect those actions.

The discovery should change how the results are presented. The scores remain, but the apparent winner loses its “best run” treatment. A visible qualification appears: these results were produced under different evaluation conditions. That feels more consequential than another paragraph in a chat sidebar.

**The central moment is when the researcher can verify the finding without trusting the agent.** They click the claim and see the two underlying records, with the relevant difference highlighted and enough surrounding context to judge it. The product distinguishes a setting declared in a configuration from evidence of what the evaluation actually used. If only the former is available, it says so.

An ambitious interaction would be a “What can we still conclude?” view. The agent doesn’t discard the results wholesale. It explains which conclusions remain supported, which become uncertain, and what additional evidence would resolve the uncertainty. That makes the product feel like a research instrument rather than an alarm system.

I’d want the researcher to challenge the finding during the demo. Something natural like, “That difference was intentional,” or “We don’t have the budget to repeat everything.” The agent should absorb that context without either surrendering its reasoning or stubbornly repeating the warning. An intentional difference can be legitimate while still preventing a direct comparison.

That exchange is probably more impressive than a flawless monologue. It shows that the researcher has authority over the investigation and that the agent’s conclusions are open to examination.

The next experiment should emerge right there, connected to the unresolved question. The proposal shows what needs to stay fixed, what needs to change, and what outcome would support the next decision. The researcher can inspect the configuration changes rather than approve a vague instruction to “run a fair comparison.”

I like the idea of the proposal responding visibly to edits. If the researcher reduces the available budget, the agent offers a narrower evaluation and explains what that would leave unresolved. If an edit accidentally reintroduces the mismatch, the workspace flags it before approval. That would make the human review step substantive: the researcher is shaping an experiment, not clicking through a permission dialog.

There’s also something powerful about letting the agent conclude, “We can’t prepare an executable reevaluation yet; one required artifact is missing.” It could still save the investigation and identify exactly what is needed. I wouldn’t force that into the main demo, but the product should be capable of it. Otherwise, its apparent competence depends on every record being conveniently complete.

The ending I imagine is a durable decision appearing in the workspace: the original comparison is qualified, the reason is attached, and a specific follow-up is approved. Anyone returning later can see what changed and why. If execution is connected, the approved job can enter the queue. If it isn’t, the proposal is honestly marked ready for handoff.

A more ambitious ending could bring in previously computed reevaluation results, clearly labeled as such, and let the workspace resolve the original question. I’m slightly wary of that for three minutes, though. A neat “and the agent was right” ending can make the whole thing feel staged. The corrected evaluation might preserve the improvement, erase it, or remain inconclusive. The product’s value should survive all three outcomes.

**What would make it feel undeniable is that the audience witnesses an unsupported decision become a defensible one.** They see the source evidence, watch the researcher challenge the interpretation, and see that challenge affect the next action. The agent’s eloquence becomes secondary because the workspace itself carries the proof.
