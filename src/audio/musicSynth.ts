import type { MusicStep } from "./musicPatterns";

type ToneOptions = {
  frequency: number;
  endFrequency?: number;
  duration: number;
  volume: number;
  wave: OscillatorType;
  filterFrequency?: number;
};

export function scheduleMusicStep(
  context: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  start: number,
  stepDuration: number,
  step: MusicStep,
): readonly AudioScheduledSourceNode[] {
  const sources: AudioScheduledSourceNode[] = [];
  if (step.kick) sources.push(scheduleKick(context, destination, start));
  if (step.snare) sources.push(...scheduleSnare(context, destination, noiseBuffer, start));
  if (step.closedHat) {
    sources.push(scheduleHat(context, destination, noiseBuffer, start, false));
  }
  if (step.openHat) {
    sources.push(scheduleHat(context, destination, noiseBuffer, start, true));
  }
  if (step.bass) {
    sources.push(...scheduleBass(context, destination, start, step.bass, stepDuration));
  }
  if (step.chord) {
    sources.push(...scheduleChord(context, destination, start, step.chord, stepDuration));
  }
  if (step.lead) {
    sources.push(...scheduleLead(context, destination, start, step.lead, stepDuration));
  }
  return sources;
}

function scheduleKick(
  context: AudioContext,
  destination: AudioNode,
  start: number,
): OscillatorNode {
  return scheduleInstrumentTone(context, destination, start, {
    frequency: 120,
    endFrequency: 48,
    duration: 0.16,
    volume: 0.3,
    wave: "sine",
  });
}

function scheduleSnare(
  context: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  start: number,
): readonly AudioScheduledSourceNode[] {
  return [
    scheduleInstrumentNoise(context, destination, noiseBuffer, start, {
      duration: 0.12,
      volume: 0.12,
      filterType: "bandpass",
      filterFrequency: 1850,
    }),
    scheduleInstrumentTone(context, destination, start, {
      frequency: 180,
      endFrequency: 115,
      duration: 0.09,
      volume: 0.1,
      wave: "triangle",
    }),
  ];
}

function scheduleHat(
  context: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  start: number,
  open: boolean,
): AudioBufferSourceNode {
  return scheduleInstrumentNoise(context, destination, noiseBuffer, start, {
    duration: open ? 0.16 : 0.035,
    volume: open ? 0.055 : 0.035,
    filterType: "highpass",
    filterFrequency: 5200,
  });
}

function scheduleBass(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  frequency: number,
  stepDuration: number,
): readonly OscillatorNode[] {
  const duration = Math.min(0.24, stepDuration * 1.45);
  return [
    scheduleInstrumentTone(context, destination, start, {
      frequency,
      duration,
      volume: 0.105,
      wave: "sine",
    }),
    scheduleInstrumentTone(context, destination, start, {
      frequency: frequency * 2,
      duration: duration * 0.82,
      volume: 0.04,
      wave: "sawtooth",
      filterFrequency: 720,
    }),
  ];
}

function scheduleChord(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  frequencies: readonly number[],
  stepDuration: number,
): readonly OscillatorNode[] {
  return frequencies.map((frequency) =>
    scheduleInstrumentTone(context, destination, start, {
      frequency,
      duration: Math.min(0.3, stepDuration * 1.65),
      volume: 0.032,
      wave: "triangle",
      filterFrequency: 1800,
    }),
  );
}

function scheduleLead(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  frequency: number,
  stepDuration: number,
): readonly OscillatorNode[] {
  const duration = Math.min(0.19, stepDuration * 1.1);
  return [
    scheduleInstrumentTone(context, destination, start, {
      frequency,
      duration,
      volume: 0.04,
      wave: "triangle",
      filterFrequency: 2400,
    }),
    scheduleInstrumentTone(context, destination, start, {
      frequency: frequency / 2,
      duration: duration * 0.9,
      volume: 0.018,
      wave: "sine",
    }),
  ];
}

function scheduleInstrumentTone(
  context: AudioContext,
  destination: AudioNode,
  start: number,
  options: ToneOptions,
): OscillatorNode {
  const oscillator = context.createOscillator();
  const filter = options.filterFrequency ? context.createBiquadFilter() : null;
  const gain = context.createGain();
  const end = start + options.duration;
  oscillator.type = options.wave;
  oscillator.frequency.setValueAtTime(options.frequency, start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  }
  if (filter && options.filterFrequency) {
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(options.filterFrequency, start);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  if (filter) oscillator.connect(filter).connect(gain).connect(destination);
  else oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    filter?.disconnect();
    gain.disconnect();
  }, { once: true });
  return oscillator;
}

function scheduleInstrumentNoise(
  context: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  start: number,
  options: {
    duration: number;
    volume: number;
    filterType: BiquadFilterType;
    filterFrequency: number;
  },
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const end = start + options.duration;
  source.buffer = noiseBuffer;
  filter.type = options.filterType;
  filter.frequency.setValueAtTime(options.filterFrequency, start);
  filter.Q.setValueAtTime(options.filterType === "bandpass" ? 0.9 : 0.3, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.volume, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  source.connect(filter).connect(gain).connect(destination);
  source.start(start);
  source.stop(end + 0.01);
  source.addEventListener("ended", () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
  return source;
}
