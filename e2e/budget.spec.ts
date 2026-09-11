import { test, expect } from "@playwright/test";
import { login, uniqueTag } from "./helpers";

test.describe("家計簿", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("記録を追加すると一覧に反映される", async ({ page }) => {
    const memo = uniqueTag("budget-add");
    await page.goto("/budget");
    await page.getByRole("button", { name: "＋ 記録" }).click();
    await page.getByLabel("金額").fill("1500");
    await page.getByLabel("メモ").fill(memo);
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("保存しました")).toBeVisible();
    await expect(page.getByText(memo)).toBeVisible();
  });

  test("記録を編集すると金額が更新される", async ({ page }) => {
    const memo = uniqueTag("budget-edit");
    await page.goto("/budget");
    await page.getByRole("button", { name: "＋ 記録" }).click();
    await page.getByLabel("金額").fill("2000");
    await page.getByLabel("メモ").fill(memo);
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText(memo)).toBeVisible();

    // 追加した行の編集ボタンを開いて金額を変更する。
    // 行のdivはメモを含む内側divをさらに内包しているため、hasTextだけで絞ると
    // ボタンを含まない内側divに当たることがある。編集ボタンを持つdivに絞り込む。
    const row = page
      .locator("div")
      .filter({ hasText: memo })
      .filter({ has: page.getByRole("button", { name: "編集" }) })
      .last();
    await row.getByRole("button", { name: "編集" }).click();
    // 既存の金額（2000）が入った状態のフィールドなので、先に空にしてから入力する
    const amountField = page.getByLabel("金額");
    await amountField.fill("");
    await amountField.fill("2500");
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page.getByText("更新しました")).toBeVisible();
    await expect(page.getByText("¥2,500")).toBeVisible();
  });

  test("記録を削除すると一覧から消え、元に戻すで復元できる", async ({ page }) => {
    const memo = uniqueTag("budget-delete");
    await page.goto("/budget");
    await page.getByRole("button", { name: "＋ 記録" }).click();
    await page.getByLabel("金額").fill("999");
    await page.getByLabel("メモ").fill(memo);
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText(memo)).toBeVisible();

    const row = page
      .locator("div")
      .filter({ hasText: memo })
      .filter({ has: page.getByRole("button", { name: "削除" }) })
      .last();
    await row.getByRole("button", { name: "削除" }).click();
    // カスタム確認ダイアログ（ブラウザ標準confirmではない）。行の削除アイコンと
    // ラベルが同じ「削除」なので、ダイアログ内のボタンに限定してクリックする。
    await page.getByRole("alertdialog").getByRole("button", { name: "削除" }).click();
    await expect(page.getByText(memo)).toHaveCount(0);

    await page.getByRole("button", { name: "元に戻す" }).click();
    await expect(page.getByText(memo)).toBeVisible();
  });
});
