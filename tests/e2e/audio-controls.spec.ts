import { expect, test } from "@playwright/test";

test("音量設定とミュート状態を保存して復元できる", async ({ page }) => {
  await page.goto("/");

  const muteButton = page.getByRole("button", { name: "音をミュートする" });
  await expect(muteButton).toBeVisible();
  await expect(muteButton).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "音量" }).click();
  const settings = page.getByRole("region", { name: "音量設定" });
  await expect(settings).toBeVisible();
  await page.getByRole("slider", { name: "BGM音量" }).fill("42");
  await page.getByRole("slider", { name: "効果音音量" }).fill("67");
  await muteButton.click();
  await expect(page.getByRole("button", { name: "音をオンにする" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.reload();
  await page.getByRole("button", { name: "音量" }).click();
  await expect(page.getByRole("slider", { name: "BGM音量" })).toHaveValue("42");
  await expect(page.getByRole("slider", { name: "効果音音量" })).toHaveValue("67");
  await expect(page.getByRole("button", { name: "音をオンにする" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "音量設定" })).toBeHidden();
});
