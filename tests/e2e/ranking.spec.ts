import { expect, test } from "@playwright/test";
import { capturePage } from "./helpers/uiAssertions";

test("ゲーム端末のランキングdialogで登録済み記録を確認できる", async ({ page, request }, testInfo) => {
  const name = `Local${Date.now().toString().slice(-6)}`;
  const response = await request.post("/api/rankings", {
    data: {
      submissionId: crypto.randomUUID(),
      displayName: name,
      score: 4321,
      successfulWalls: 21,
      speedLevel: 4,
      misses: 1,
    },
  });
  expect(response.status()).toBe(201);

  await page.goto("/");
  await page.getByRole("button", { name: "ランキング", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "ランキング" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(name)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "更新" })).toBeVisible();
  await expect(dialog.locator('img[alt*="QRコード"]')).toHaveCount(0);
  await expect(dialog).not.toContainText("スマホでランキング");
  await capturePage(page, testInfo, "local-ranking-dialog");
});

test("タイトルからランキングdialogを開閉できる", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ランキング", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "ランキング" })).toBeVisible();
  await capturePage(page, testInfo, "desktop-ranking-dialog");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "ランキング" })).toBeHidden();
});

test("開始前に有効なニックネームを必須とする", async ({ page }) => {
  await page.goto("/");

  const nickname = page.getByLabel("ランキング用ニックネーム");
  const start = page.getByRole("button", { name: "ゲーム開始" });
  await expect(start).toBeDisabled();

  await nickname.fill("<script>");
  await expect(page.getByText("ニックネームに使用できない文字が含まれています")).toBeVisible();
  await expect(start).toBeDisabled();

  await nickname.fill("  テスト参加者  ");
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.getByRole("heading", { name: "カメラ準備" })).toBeVisible();
});

test("公開ランキングとQR endpointを提供しない", async ({ request }) => {
  expect((await request.get("/ranking")).status()).toBe(404);
  expect((await request.get("/api/ranking-qr")).status()).toBe(404);
});

test("ゲーム端末のローカルhealthでSQLite接続を確認できる", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
