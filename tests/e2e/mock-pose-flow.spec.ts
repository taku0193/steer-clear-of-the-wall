import { expect, test } from "@playwright/test";

test("モック姿勢で開始し、結果画面から再プレイ準備へ戻れる", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Steer Clear of the Wall" }),
  ).toBeVisible();
  const titleCanvas = page.locator(".title-game-preview");
  await expect(titleCanvas).toBeVisible();
  const titleCanvasHasPixels = await titleCanvas.evaluate(
    (canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d");
      const pixels = context?.getImageData(0, 0, canvas.width, canvas.height).data;
      return canvas.width > 0 && canvas.height > 0 && Boolean(pixels?.some((value) => value > 0));
    },
  );
  expect(titleCanvasHasPixels).toBe(true);

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
  await expect(page.getByLabel("残りハート5個")).toHaveText("♥♥♥♥♥");

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

test("展示向けリセットで準備画面とプレイ画面からタイトルへ戻れる", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await expect(page.getByRole("heading", { name: "カメラ準備" })).toBeVisible();

  await page.getByRole("button", { name: "タイトルへ戻る" }).click();
  await expect(
    page.getByRole("heading", { name: "Steer Clear of the Wall" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "ゲーム開始" }).click();
  await page.getByRole("button", { name: "モック姿勢で試す" }).click();
  await expect(
    page.getByLabel("プレイヤー姿勢と壁パターンのゲーム描画"),
  ).toBeVisible({ timeout: 5_000 });

  await page
    .getByRole("button", { name: "プレイを終了してタイトルへ戻る" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Steer Clear of the Wall" }),
  ).toBeVisible();
});
