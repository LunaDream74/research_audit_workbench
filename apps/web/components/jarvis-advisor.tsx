import type { JarvisReview } from "@/src/domain/jarvis-review";

export function JarvisAdvisor({ review, onNextAction }: {
  review: JarvisReview;
  onNextAction: () => void;
}) {
  const complete = review.nextAction.id === "complete";
  return (
    <section className="jarvis-panel" aria-label="JARVIS advisor" aria-live="polite">
      <div className="jarvis-heading">
        <div>
          <p className="eyebrow">JARVIS advisor · live comparison</p>
          <h2>Compare, critique, improve</h2>
        </div>
        <div className="jarvis-score" aria-label={`Decision readiness ${review.score} percent`}>
          <strong>{review.score}</strong><span>/ 100</span>
        </div>
      </div>
      <div
        className="jarvis-progress"
        aria-label={`Decision readiness: ${review.score} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={review.score}
        role="progressbar"
      ><span style={{ width: `${review.score}%` }} /></div>
      <p className="jarvis-summary">{review.summary}</p>
      <div className="jarvis-next">
        <div>
          <span>{review.nextAction.humanRequired ? "Researcher action" : "Safe to stage"} · {review.phase}</span>
          <h3>{review.nextAction.title}</h3>
          <p>{review.nextAction.reason}</p>
        </div>
        <button className={review.nextAction.humanRequired ? "secondary-button" : ""} disabled={complete} onClick={onNextAction} type="button">
          {complete ? "Decision package complete" : review.nextAction.humanRequired ? "Show required control" : "Stage safe next step"}
        </button>
      </div>
      {review.suggestions.length > 1 && (
        <div className="jarvis-queue" aria-label="Suggested improvements">
          {review.suggestions.slice(1).map((suggestion) => (
            <div key={suggestion.id}><span>{suggestion.priority}</span><strong>{suggestion.title}</strong></div>
          ))}
        </div>
      )}
      <small>{review.authorityBoundary}</small>
    </section>
  );
}
