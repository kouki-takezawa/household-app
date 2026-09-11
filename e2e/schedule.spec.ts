import { test, expect } from "@playwright/test";
import { login, uniqueTag } from "./helpers";

test.describe("日程表", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("予定を追加すると一覧に反映される", async ({ page }) => {
    const title = uniqueTag("event-add");
    await page.goto("/schedule");
    await page.getByRole("button", { name: "＋ 予定を追加" }).click();
    await page.getByLabel("タイトル").fill(title);
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("予定を追加しました")).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
  });
});
