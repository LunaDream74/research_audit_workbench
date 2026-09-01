import { describe, expect, it } from "vitest";
import { demoRuns, recordedScore, selectedPairLabel } from "./fixture";

describe("disposable demo fixture", () => {
  it("preserves the hero evidence without declaring a best model", () => {
    expect(demoRuns.map(recordedScore)).toEqual(["84%", "76%"]);
    expect(demoRuns.map((run) => run.candidateCount)).toEqual([200, 1000]);
    expect(JSON.stringify(demoRuns).toLowerCase()).not.toContain("best");
  });

  it("makes the exact pair visible", () => {
    expect(selectedPairLabel(["run-a", "run-b"])).toBe("Comparing Run A and Run B");
    expect(selectedPairLabel(["run-a"])).toBe("Select exactly two runs");
  });
});

