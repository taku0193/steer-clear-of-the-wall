import { expect, test } from "@playwright/test";
import {
  capturePage,
  expectCanvasHasVisualContent,
  expectInsideViewport,
  expectNoIntersection,
} from "./helpers/uiAssertions";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "low", width: 960, height: 540 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}で主要UIが画面内に収まる`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const titleCanvas = page.locator(".title-game-preview");
    await expect(titleCanvas).toBeVisible();
    await expectCanvasHasVisualContent(titleCanvas);
    await expectInsideViewport(page.getByRole("button", { name: "ゲーム開始" }), page);
    await capturePage(page, testInfo, `${viewport.name}-title`);

    await page.getByLabel("ランキング用ニックネーム").fill("Visual確認");
    await page.getByRole("button", { name: "ゲーム開始" }).click();
    await expectInsideViewport(page.getByRole("button", { name: "カメラを開始" }), page);
    await capturePage(page, testInfo, `${viewport.name}-preparation`);

    await page.getByRole("button", { name: "モック姿勢で試す" }).click();
    const gameCanvas = page.getByLabel("プレイヤー姿勢と壁パターンのゲーム描画");
    await expect(gameCanvas).toBeVisible({ timeout: 7_000 });
    await expectCanvasHasVisualContent(gameCanvas);
    const hud = page.getByLabel("プレイ状況");
    const exit = page.getByRole("button", { name: "プレイを終了してタイトルへ戻る" });
    await expect(hud).toContainText("♥♥♥♥♥");
    await expectInsideViewport(hud, page);
    await expectInsideViewport(exit, page);
    await expectNoIntersection(hud, exit);
    await capturePage(page, testInfo, `${viewport.name}-playing`);

    if (viewport.name === "desktop") {
      await expect(page.getByRole("heading", { name: "結果" })).toBeVisible({
        timeout: 30_000,
      });
      await expectInsideViewport(page.getByLabel("今回の結果"), page);
      await capturePage(page, testInfo, "desktop-result");
    }
  });
}
