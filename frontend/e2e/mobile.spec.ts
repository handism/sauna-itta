import { expect, test } from "@playwright/test";

test("モバイルでボトムシートを開閉して追加フォームへ移動できる", async ({ page }) => {
  await page.goto("./");

  const handle = page.getByRole("button", { name: "パネルを開く" });
  await expect(handle).toBeVisible();
  await handle.click();
  await expect(page.getByRole("button", { name: "パネルを最大化する" })).toBeVisible();

  await page.getByRole("button", { name: "サウナ追加" }).click();
  await expect(page.getByText("地図をタップして場所を選択")).toBeVisible();
  await page.getByRole("button", { name: "場所の選択をやめる" }).click();
  await expect(page.getByRole("button", { name: "サウナ追加" })).toBeVisible();
});
