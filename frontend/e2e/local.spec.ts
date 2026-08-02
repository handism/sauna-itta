import { expect, test } from "@playwright/test";

test("localモードでテーマと統計画面の導線が動作する", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("heading", { name: "サウナイッタ" })).toBeVisible();
  await page.getByRole("button", { name: /モードに切り替え/ }).click();
  const savedTheme = await page.evaluate(() => localStorage.getItem("sauna-itta_theme"));
  expect(savedTheme === "light" || savedTheme === "dark").toBe(true);

  await page.reload();
  if (savedTheme === "light") {
    await expect(page.locator("html")).toHaveClass(/light-theme/);
  } else {
    await expect(page.locator("html")).not.toHaveClass(/light-theme/);
  }

  await page.getByRole("link", { name: "統計ダッシュボード" }).click();
  await expect(page.getByRole("heading", { name: "統計ダッシュボード" })).toBeVisible();
  await expect(page.getByRole("link", { name: "マップに戻る" })).toBeVisible();
});

test("地点検索は入力だけでは送信せず、明示操作で一度だけ検索する", async ({ page }) => {
  let requestCount = 0;
  await page.route("https://nominatim.openstreetmap.org/search?**", async (route) => {
    requestCount += 1;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          place_id: 1,
          lat: "35.6812",
          lon: "139.7671",
          display_name: "東京駅, 東京都, 日本",
          name: "東京駅",
          address: { state: "東京都", city: "千代田区", road: "丸の内" },
        },
      ]),
    });
  });

  await page.goto("./");
  await page.getByRole("button", { name: "新規ピンを立てる" }).click();
  const input = page.getByRole("combobox", { name: "地点検索" });
  await input.fill("東京駅");
  await page.waitForTimeout(500);
  expect(requestCount).toBe(0);

  await page.getByRole("button", { name: "地点を検索" }).click();
  await expect(page.getByRole("option", { name: /東京駅/ })).toBeVisible();
  expect(requestCount).toBe(1);
});
