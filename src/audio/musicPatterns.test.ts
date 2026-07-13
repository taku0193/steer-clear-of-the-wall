import { describe, expect, it } from "vitest";
import {
  getMusicPattern,
  getStepDurationSeconds,
  MUSIC_STEPS_PER_LOOP,
  type MusicStep,
} from "./musicPatterns";

describe("musicPatterns", () => {
  it.each(["lobby", "play"] as const)("%sは4小節64stepである", (track) => {
    expect(getMusicPattern(track).steps).toHaveLength(MUSIC_STEPS_PER_LOOP);
  });

  it("BPMから16分音符相当のstep時間を計算する", () => {
    expect(getStepDurationSeconds({ bpm: 120 })).toBe(0.125);
  });

  it.each(["lobby", "play"] as const)("%sは全楽器の役割を持つ", (track) => {
    const steps = getMusicPattern(track).steps;
    for (const key of ["kick", "snare", "closedHat", "openHat", "bass", "chord", "lead"] satisfies (keyof MusicStep)[]) {
      expect(steps.some((step) => Boolean(step[key])), key).toBe(true);
    }
  });

  it("playはlobbyより高密度で4小節目にfillを持つ", () => {
    const lobbyEvents = countEvents(getMusicPattern("lobby").steps);
    const play = getMusicPattern("play").steps;
    expect(countEvents(play)).toBeGreaterThan(lobbyEvents);
    expect(play.slice(48).some((step) => step.openHat || step.lead || step.snare)).toBe(true);
  });
});

function countEvents(steps: readonly MusicStep[]): number {
  return steps.reduce(
    (total, step) => total + Object.values(step).filter(Boolean).length,
    0,
  );
}
