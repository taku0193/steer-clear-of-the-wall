import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeHeartRateCharacteristic extends EventTarget {
      value: DataView | null = null;
      async startNotifications() { return this; }
      async stopNotifications() { return this; }
      emit(bpm: number) {
        this.value = new DataView(Uint8Array.from([0, bpm]).buffer);
        this.dispatchEvent(new Event("characteristicvaluechanged"));
      }
    }

    const characteristic = new FakeHeartRateCharacteristic();
    const server = {
      connected: false,
      async connect() { this.connected = true; return this; },
      disconnect() { this.connected = false; },
      async getPrimaryService() {
        return { getCharacteristic: async () => characteristic };
      },
    };
    const device = Object.assign(new EventTarget(), { gatt: server });
    Object.defineProperty(navigator, "bluetooth", {
      configurable: true,
      value: { requestDevice: async () => device },
    });
    Object.assign(window, {
      __emitHeartRate: (bpm: number) => characteristic.emit(bpm),
      __disconnectHeartRate: () => {
        server.connected = false;
        device.dispatchEvent(new Event("gattserverdisconnected"));
      },
    });
  });
});

test("Fitbit Airのライブ心拍をHUDと結果グラフへ表示する", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ランキング用ニックネーム").fill("心拍E2E");
  await page.getByRole("button", { name: "ゲーム開始" }).click();

  await page.getByRole("button", { name: "Fitbit Airを接続" }).click();
  await page.evaluate(() => {
    (window as Window & { __emitHeartRate(bpm: number): void }).__emitHeartRate(78);
  });
  await expect(page.getByLabel("Fitbit Air心拍数")).toContainText("78");
  await expect(page.getByLabel("Fitbit Air心拍数")).toContainText("LIVE");

  await page.getByRole("button", { name: "モック姿勢で試す" }).click();
  await expect(page.getByLabel("プレイヤー姿勢と壁パターンのゲーム描画")).toBeVisible({ timeout: 7_000 });

  for (const bpm of [92, 108, 101]) {
    await page.evaluate((value) => {
      (window as Window & { __emitHeartRate(bpm: number): void }).__emitHeartRate(value);
    }, bpm);
    await page.waitForTimeout(150);
  }
  await expect(page.getByLabel("プレイ状況")).toContainText("101");
  await expect(page.getByLabel("プレイ状況")).toContainText("LIVE");

  await page.waitForTimeout(5_200);
  await expect(page.getByLabel("プレイ状況")).toContainText("--");
  await expect(page.getByLabel("プレイ状況")).toContainText("切断");
  await page.evaluate(() => {
    (window as Window & { __emitHeartRate(bpm: number): void }).__emitHeartRate(103);
  });
  await expect(page.getByLabel("プレイ状況")).toContainText("103");
  await expect(page.getByLabel("プレイ状況")).toContainText("LIVE");

  await expect(page.getByRole("heading", { name: "結果" })).toBeVisible({ timeout: 30_000 });
  const heartRateResult = page.getByRole("region", { name: "プレイ中の心拍数" });
  await expect(heartRateResult).toContainText("最小");
  await expect(heartRateResult).toContainText("平均");
  await expect(heartRateResult).toContainText("最大");
  await expect(page.getByRole("img", { name: "プレイ中の心拍数推移グラフ" })).toBeVisible();
});

test("心拍切断後もゲームを継続し、再接続操作を表示する", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ランキング用ニックネーム").fill("切断E2E");
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await page.getByRole("button", { name: "Fitbit Airを接続" }).click();
  await page.getByRole("button", { name: "モック姿勢で試す" }).click();
  await expect(page.getByLabel("プレイヤー姿勢と壁パターンのゲーム描画")).toBeVisible({ timeout: 7_000 });
  await page.evaluate(() => {
    (window as Window & { __disconnectHeartRate(): void }).__disconnectHeartRate();
  });
  await expect(page.getByRole("button", { name: "心拍を再接続" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "結果" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("今回は心拍データを記録できませんでした。")).toBeVisible();
});
