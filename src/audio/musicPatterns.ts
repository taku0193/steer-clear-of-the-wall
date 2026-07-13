import type { BgmTrack } from "./audioTypes";

export type MusicStep = {
  kick?: boolean;
  snare?: boolean;
  closedHat?: boolean;
  openHat?: boolean;
  bass?: number;
  chord?: readonly number[];
  lead?: number;
};

export type MusicPattern = {
  bpm: number;
  steps: readonly MusicStep[];
};

const STEPS_PER_BAR = 16;
const BARS_PER_LOOP = 4;
export const MUSIC_STEPS_PER_LOOP = STEPS_PER_BAR * BARS_PER_LOOP;

const LOBBY_PATTERN: MusicPattern = {
  bpm: 94,
  steps: createLobbySteps(),
};

const PLAY_PATTERN: MusicPattern = {
  bpm: 128,
  steps: createPlaySteps(),
};

export function getMusicPattern(track: Exclude<BgmTrack, "none">): MusicPattern {
  return track === "lobby" ? LOBBY_PATTERN : PLAY_PATTERN;
}

export function getStepDurationSeconds(pattern: Pick<MusicPattern, "bpm">): number {
  return 60 / pattern.bpm / 4;
}

function createLobbySteps(): readonly MusicStep[] {
  const steps = createEmptySteps();
  const roots = [110, 130.81, 98, 123.47];
  const chords = [
    [220, 261.63, 329.63],
    [261.63, 329.63, 392],
    [196, 246.94, 293.66],
    [246.94, 293.66, 369.99],
  ] as const;

  for (let bar = 0; bar < BARS_PER_LOOP; bar += 1) {
    const offset = bar * STEPS_PER_BAR;
    setFlags(steps, [offset, offset + 8], "kick");
    setFlags(steps, [offset + 4, offset + 12], "snare");
    setFlags(steps, [offset + 2, offset + 6, offset + 10, offset + 14], "closedHat");
    setNotes(steps, [offset, offset + 7, offset + 10], "bass", roots[bar]);
    steps[offset] = { ...steps[offset], chord: chords[bar] };
  }

  const fill = [293.66, 329.63, 392, 440];
  for (let index = 0; index < fill.length; index += 1) {
    const step = 56 + index * 2;
    steps[step] = { ...steps[step], lead: fill[index] };
  }
  steps[62] = { ...steps[62], openHat: true, closedHat: false };
  return steps;
}

function createPlaySteps(): readonly MusicStep[] {
  const steps = createEmptySteps();
  const roots = [130.81, 116.54, 98, 123.47];
  const chords = [
    [261.63, 311.13, 392],
    [233.08, 293.66, 349.23],
    [196, 246.94, 293.66],
    [246.94, 311.13, 369.99],
  ] as const;
  const bassOffsets = [0, 3, 6, 8, 11, 14];

  for (let bar = 0; bar < BARS_PER_LOOP; bar += 1) {
    const offset = bar * STEPS_PER_BAR;
    setFlags(steps, [offset, offset + 4, offset + 8, offset + 12], "kick");
    setFlags(steps, [offset + 4, offset + 12], "snare");
    setFlags(steps, [offset + 2, offset + 6, offset + 10, offset + 14], "closedHat");
    setNotes(steps, bassOffsets.map((position) => offset + position), "bass", roots[bar]);
    steps[offset + 6] = { ...steps[offset + 6], chord: chords[bar] };
    steps[offset + 14] = { ...steps[offset + 14], chord: chords[bar] };
  }

  const motif = [523.25, 622.25, 698.46, 783.99];
  for (const barOffset of [16, 48]) {
    for (let index = 0; index < motif.length; index += 1) {
      const step = barOffset + 4 + index * 2;
      steps[step] = { ...steps[step], lead: motif[index] };
    }
  }
  steps[62] = { ...steps[62], openHat: true, closedHat: false };
  steps[63] = { ...steps[63], snare: true };
  return steps;
}

function createEmptySteps(): MusicStep[] {
  return Array.from({ length: MUSIC_STEPS_PER_LOOP }, () => ({}));
}

function setFlags(
  steps: MusicStep[],
  positions: readonly number[],
  key: "kick" | "snare" | "closedHat",
) {
  for (const position of positions) {
    steps[position] = { ...steps[position], [key]: true };
  }
}

function setNotes(
  steps: MusicStep[],
  positions: readonly number[],
  key: "bass",
  frequency: number,
) {
  for (const position of positions) {
    steps[position] = { ...steps[position], [key]: frequency };
  }
}
