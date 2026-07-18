import { describe, expect, it, vi } from "vitest";
import type { HeartRateAdapterEvent } from "./heartRateTypes";
import { WebBluetoothHeartRateAdapter } from "./webBluetoothHeartRate";

class FakeCharacteristic extends EventTarget {
  value: DataView | null = null;
  startNotifications = vi.fn(async () => this);
  stopNotifications = vi.fn(async () => this);

  emit(bytes: readonly number[]) {
    this.value = new DataView(Uint8Array.from(bytes).buffer);
    this.dispatchEvent(new Event("characteristicvaluechanged"));
  }
}

function createFixture() {
  const characteristic = new FakeCharacteristic();
  class FakeServer {
    connected = false;
    connect = vi.fn(async () => {
      this.connected = true;
      return this;
    });
    disconnect = vi.fn(() => {
      this.connected = false;
    });
    getPrimaryService = vi.fn(async () => ({
      getCharacteristic: vi.fn(async () => characteristic),
    }));
  }
  const server = new FakeServer();
  const device = Object.assign(new EventTarget(), { gatt: server });
  const requestDevice = vi.fn(async () => device);
  let now = 1_000;
  const adapter = new WebBluetoothHeartRateAdapter({
    getBluetooth: () => ({ requestDevice }),
    isSecureContext: () => true,
    now: () => now,
  });
  return { adapter, characteristic, requestDevice, server, setNow: (value: number) => { now = value; } };
}

describe("WebBluetoothHeartRateAdapter", () => {
  it("接続してnotificationをreadingへ変換し、切断時にcleanupする", async () => {
    const fixture = createFixture();
    const events: HeartRateAdapterEvent[] = [];
    fixture.adapter.subscribe((event) => events.push(event));

    await fixture.adapter.connect();
    fixture.setNow(2_000);
    fixture.characteristic.emit([0x00, 88]);
    await fixture.adapter.disconnect();

    expect(fixture.requestDevice).toHaveBeenCalledOnce();
    expect(events).toContainEqual({ type: "status", status: "connected" });
    expect(events).toContainEqual({
      type: "reading",
      reading: { bpm: 88, receivedAtMs: 2_000 },
    });
    expect(fixture.characteristic.stopNotifications).toHaveBeenCalledOnce();
    expect(fixture.server.disconnect).toHaveBeenCalledOnce();
  });

  it("同時connectでchooserを多重表示しない", async () => {
    const fixture = createFixture();
    await Promise.all([fixture.adapter.connect(), fixture.adapter.connect()]);
    expect(fixture.requestDevice).toHaveBeenCalledOnce();
  });

  it("非対応を局所errorとして通知する", async () => {
    const adapter = new WebBluetoothHeartRateAdapter({
      getBluetooth: () => null,
      isSecureContext: () => true,
      now: () => 0,
    });
    const events: HeartRateAdapterEvent[] = [];
    adapter.subscribe((event) => events.push(event));
    await expect(adapter.connect()).rejects.toBeDefined();
    expect(events).toContainEqual({
      type: "status",
      status: "error",
    });
    expect(events.some((event) => event.type === "error" && event.error.code === "unsupported")).toBe(true);
  });
});
