import { test, expect } from "@playwright/test";
import { PASSCODE } from "./helpers";

test.describe("ログイン", () => {
  test("正しい合言葉でログインし、ホーム画面が表示される", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="password"]').fill(PASSCODE);
    await page.keyboard.press("Enter");
    await page.waitForURL("/");
    await expect(page.getByText("わが家")).toBeVisible();
  });

  test("間違った合言葉だとエラーが表示されログインできない", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="password"]').fill("9999");
    await page.keyboard.press("Enter");
    await expect(page.getByText("合言葉が違います")).toBeVisible();
    expect(page.url()).toContain("/login");
  });

  test("未ログイン状態で認証必須ページに直接アクセスするとログイン画面へリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/budget");
    await page.waitForURL(/\/login/);
  });
});
