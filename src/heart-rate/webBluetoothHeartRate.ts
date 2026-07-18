import { parseHeartRateMeasurement } from "./heartRateMeasurement";
import type {
  HeartRateAdapter,
  HeartRateAdapterEvent,
  HeartRateAdapterListener,
  HeartRateErrorCode,
} from "./heartRateTypes";

export const HEART_RATE_SERVICE = "heart_rate";
export const HEART_RATE_MEASUREMENT = "heart_rate_measurement";

type EventSource = {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

type CharacteristicLike = EventSource & {
  value?: DataView | null;
  startNotifications(): Promise<CharacteristicLike>;
  stopNotifications?: () => Promise<CharacteristicLike>;
};

type GattServerLike = {
  connected: boolean;
  connect(): Promise<GattServerLike>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<{
    getCharacteristic(characteristic: string): Promise<CharacteristicLike>;
  }>;
};

type BluetoothDeviceLike = EventSource & {
  gatt?: GattServerLike | null;
};

type BluetoothApiLike = {
  requestDevice(options: {
    filters: readonly { services: readonly string[] }[];
  }): Promise<BluetoothDeviceLike>;
};

type BluetoothEnvironment = {
  getBluetooth(): BluetoothApiLike | null;
  isSecureContext(): boolean;
  now(): number;
};

const defaultEnvironment: BluetoothEnvironment = {
  getBluetooth: () => {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      return null;
    }
    return (navigator as Navigator & { bluetooth: BluetoothApiLike }).bluetooth;
  },
  isSecureContext: () =>
    typeof window !== "undefined" && window.isSecureContext,
  now: () => performance.now(),
};

export class WebBluetoothHeartRateAdapter implements HeartRateAdapter {
  private readonly listeners = new Set<HeartRateAdapterListener>();
  private device: BluetoothDeviceLike | null = null;
  private characteristic: CharacteristicLike | null = null;
  private connectPromise: Promise<void> | null = null;
  private generation = 0;

  constructor(private readonly environment = defaultEnvironment) {
    this.handleMeasurement = this.handleMeasurement.bind(this);
    this.handleDisconnected = this.handleDisconnected.bind(this);
  }

  isSupported(): boolean {
    return Boolean(this.environment.getBluetooth());
  }

  subscribe(listener: HeartRateAdapterListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    this.connectPromise = this.connectInternal().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private async connectInternal(): Promise<void> {
    const bluetooth = this.environment.getBluetooth();
    if (!bluetooth) {
      this.fail("unsupported", "このブラウザはWeb Bluetoothに対応していません。Chrome系ブラウザを使用してください。");
    }
    if (!this.environment.isSecureContext()) {
      this.fail("insecureContext", "Bluetoothを利用するにはlocalhostまたはHTTPSで開いてください。");
    }

    const generation = ++this.generation;
    this.emit({ type: "status", status: "requesting" });

    try {
      if (!this.device) {
        this.device = await bluetooth!.requestDevice({
          filters: [{ services: [HEART_RATE_SERVICE] }],
        });
        this.device.addEventListener(
          "gattserverdisconnected",
          this.handleDisconnected as EventListener,
        );
      }

      if (generation !== this.generation) return;
      if (!this.device.gatt) {
        this.fail("connectionFailed", "選択した心拍計へ接続できません。心拍数共有を確認してください。");
      }

      let server: GattServerLike;
      try {
        server = await this.device.gatt!.connect();
      } catch (error) {
        this.fail("connectionFailed", friendlyConnectionMessage(error));
      }

      let characteristic: CharacteristicLike;
      try {
        const service = await server!.getPrimaryService(HEART_RATE_SERVICE);
        characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
      } catch {
        this.fail("serviceUnavailable", "心拍数サービスを利用できません。Fitbit Airの心拍数共有を有効にしてください。");
      }

      if (generation !== this.generation) {
        server!.disconnect();
        return;
      }

      this.characteristic = characteristic!;
      this.characteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleMeasurement as EventListener,
      );
      try {
        await this.characteristic.startNotifications();
      } catch {
        this.characteristic.removeEventListener(
          "characteristicvaluechanged",
          this.handleMeasurement as EventListener,
        );
        this.characteristic = null;
        this.fail("notificationFailed", "心拍数の受信を開始できません。接続し直してください。");
      }

      if (generation !== this.generation) return;
      this.emit({ type: "status", status: "connected" });
    } catch (error) {
      if (isHeartRateFailure(error)) throw error;
      const code = getDomExceptionName(error) === "NotFoundError"
        ? "deviceNotSelected"
        : "connectionFailed";
      const message = code === "deviceNotSelected"
        ? "デバイスが選択されませんでした。もう一度接続できます。"
        : friendlyConnectionMessage(error);
      this.emit({ type: "error", error: { code, message } });
      this.emit({ type: "status", status: code === "deviceNotSelected" ? "idle" : "error" });
    }
  }

  async disconnect(options: { forgetDevice?: boolean } = {}): Promise<void> {
    this.generation += 1;
    const characteristic = this.characteristic;
    this.characteristic = null;
    if (characteristic) {
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        this.handleMeasurement as EventListener,
      );
      try {
        await characteristic.stopNotifications?.();
      } catch {
        // 切断処理はbest effortで継続します。
      }
    }

    if (this.device?.gatt?.connected) this.device.gatt.disconnect();
    if (options.forgetDevice && this.device) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.handleDisconnected as EventListener,
      );
      this.device = null;
    }
    this.emit({ type: "status", status: "disconnected" });
  }

  private handleMeasurement(event: Event): void {
    const value = (event.target as CharacteristicLike | null)?.value;
    try {
      const bpm = parseHeartRateMeasurement(value);
      this.emit({
        type: "reading",
        reading: { bpm, receivedAtMs: this.environment.now() },
      });
    } catch {
      // 壊れた1通知だけを捨て、接続とゲームは継続します。
    }
  }

  private handleDisconnected(): void {
    if (this.characteristic) {
      this.characteristic.removeEventListener(
        "characteristicvaluechanged",
        this.handleMeasurement as EventListener,
      );
      this.characteristic = null;
    }
    this.emit({ type: "status", status: "disconnected" });
  }

  private fail(code: HeartRateErrorCode, message: string): never {
    this.emit({ type: "error", error: { code, message } });
    this.emit({ type: "status", status: "error" });
    throw { heartRateFailure: true };
  }

  private emit(event: HeartRateAdapterEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

function friendlyConnectionMessage(error: unknown): string {
  if (getDomExceptionName(error) === "NetworkError") {
    return "Bluetooth接続に失敗しました。他の機器との接続を解除し、心拍数共有を確認してください。";
  }
  return "Bluetooth接続に失敗しました。Fitbit Airを近づけて、もう一度お試しください。";
}

function getDomExceptionName(error: unknown): string | null {
  return typeof error === "object" && error !== null && "name" in error
    ? String(error.name)
    : null;
}

function isHeartRateFailure(error: unknown): boolean {
  return typeof error === "object" && error !== null && "heartRateFailure" in error;
}

export function createWebBluetoothHeartRateAdapter(): HeartRateAdapter {
  return new WebBluetoothHeartRateAdapter();
}
