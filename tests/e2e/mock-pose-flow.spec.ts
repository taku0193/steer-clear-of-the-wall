import { expect, test } from "@playwright/test";

test("モック姿勢で開始し、結果画面から再プレイ準備へ戻れる", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Steer Clear of the Wall" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await expect(page.getByRole("heading", { name: "カメラ準備" })).toBeVisible();
  await expect(page.getByText("カメラは未接続です")).toBeVisible();

  await page.getByRole("button", { name: "モック姿勢で試す" }).click();
  await expect(page.getByRole("heading", { name: "まもなく開始" })).toBeVisible();

  await expect(
    page.getByLabel("プレイヤー姿勢と壁パターンのゲーム描画"),
  ).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("モック / モック姿勢を使用中")).toBeVisible();
  await expect(page.getByLabel("プレイ状況")).toContainText("Lv.1");

  await expect(page.getByRole("heading", { name: "結果" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByLabel("今回の結果")).toContainText("最終スコア");
  await expect(page.getByLabel("今回の結果")).toContainText("クリア枚数");
  await expect(page.getByLabel("今回の結果")).toContainText("最高速度");
  await expect(page.getByLabel("今回の結果")).toContainText("ミス数");

  await page.getByRole("button", { name: "もう一度プレイ" }).click();
  await expect(page.getByRole("heading", { name: "カメラ準備" })).toBeVisible();
  await expect(page.getByText("カメラは未接続です")).toBeVisible();
});
