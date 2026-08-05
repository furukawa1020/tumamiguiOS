import { test, expect } from "@playwright/test";

test("smoke", async ({ page }) => {
  await page.goto("/?mode=pointer");
  await expect(page.locator("h1")).toHaveText("Tsumamigui");
  await page.getByRole("button", { name: "Start pointer mode" }).click();
  await expect(page.locator("#restart")).toBeVisible();

  const canvas = page.locator("#app-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas not found");
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await page.mouse.up();
  await expect(page.locator("#app-status")).toBeVisible();
});
