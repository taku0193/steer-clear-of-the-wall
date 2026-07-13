import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

export async function expectInsideViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

export async function expectCanvasHasVisualContent(canvas: Locator) {
  const colorCount = await canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext("2d");
    if (!context || element.width === 0 || element.height === 0) return 0;
    const colors = new Set<string>();
    const columns = 8;
    const rows = 8;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = Math.min(element.width - 1, Math.floor(((column + 0.5) / columns) * element.width));
        const y = Math.min(element.height - 1, Math.floor(((row + 0.5) / rows) * element.height));
        colors.add(Array.from(context.getImageData(x, y, 1, 1).data).join(","));
      }
    }
    return colors.size;
  });
  expect(colorCount).toBeGreaterThan(2);
}

export async function capturePage(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

export async function expectNoIntersection(first: Locator, second: Locator) {
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  if (!firstBox || !secondBox) return;
  const intersects = !(
    firstBox.x + firstBox.width <= secondBox.x ||
    secondBox.x + secondBox.width <= firstBox.x ||
    firstBox.y + firstBox.height <= secondBox.y ||
    secondBox.y + secondBox.height <= firstBox.y
  );
  expect(intersects).toBe(false);
}
