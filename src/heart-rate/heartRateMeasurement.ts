import {
  MAX_HEART_RATE_BPM,
  MIN_HEART_RATE_BPM,
} from "./heartRateTypes";

export function parseHeartRateMeasurement(value: unknown): number {
  if (!(value instanceof DataView) || value.byteLength < 2) {
    throw new Error("心拍数データが空、または短すぎます。");
  }

  const flags = value.getUint8(0);
  const is16Bit = (flags & 0x01) !== 0;

  if (is16Bit && value.byteLength < 3) {
    throw new Error("16bit心拍数データが途中で切れています。");
  }

  const bpm = is16Bit ? value.getUint16(1, true) : value.getUint8(1);

  if (!isValidHeartRate(bpm)) {
    throw new Error(`想定範囲外の心拍数です: ${bpm} BPM`);
  }

  return bpm;
}

export function isValidHeartRate(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    Number(value) >= MIN_HEART_RATE_BPM &&
    Number(value) <= MAX_HEART_RATE_BPM
  );
}
