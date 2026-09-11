import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("横断検索", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ホームのプレビューは最大8件までで、続きは全件表示ページで見られる", async ({ page }) => {
    // モックサーバーに「検索テスト0」〜「検索テスト9」の10件を事前に仕込んである
    await page.goto("/");
    await page.getByPlaceholder("家計簿・予定・資産記録を検索").fill("検索テスト");

    const moreLink = page.getByRole("link", { name: /他\d+件/ });
    await expect(moreLink).toBeVisible();
    await expect(moreLink).toHaveText("他2件 →");

    await moreLink.click();
    await expect(page).toHaveURL(/\/search\?q=/);

    // 全件表示ページでは10件すべて（上限で切られない）表示される
    for (let i = 0; i < 10; i++) {
      await expect(page.getByText(`検索テスト${i}`)).toBeVisible();
    }
    // 全件表示ページでは「他◯件」リンクは出ない
    await expect(page.getByRole("link", { name: /他\d+件/ })).toHaveCount(0);
  });

  test("該当なしのキーワードでは「見つかりません」が表示される", async ({ page }) => {
    await page.goto("/search?q=存在しないはずのキーワードxyz123");
    await expect(page.getByText("該当する記録が見つかりません")).toBeVisible();
  });
});
